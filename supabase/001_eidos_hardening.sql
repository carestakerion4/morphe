-- =====================================================================
-- 001_eidos_hardening.sql
--
-- ПЕРЕД ЗАПУСКОМ:
--   1. Сделай бэкап или прогони на staging-проекте. Этот файл НЕ тестировался
--      на твоей базе: он написан по коду приложения.
--   2. Выполни 000_preflight.sql и посмотри результаты.
--   3. Запускай целиком в SQL Editor и сразу после этого деплой новый фронтенд:
--      старый клиент после шага 3 перестанет работать (он пишет views/is_banned напрямую).
--
-- Файл идемпотентен: повторный запуск безопасен.
-- Секции независимы настолько, насколько возможно; описание — в заголовках.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Колонки и значения по умолчанию
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists link_clicks jsonb not null default '{}'::jsonb;
-- NULL в флагах превратил бы "not is_banned" в NULL и тихо выключил бы счётчики/правку профиля.
update public.profiles set is_banned = false where is_banned is null;
update public.profiles set is_admin  = false where is_admin  is null;
update public.profiles set views     = 0     where views     is null;
alter table public.profiles alter column views set default 0;
alter table public.profiles alter column is_admin set default false;
alter table public.profiles alter column is_banned set default false;

-- ---------------------------------------------------------------------
-- 2. Перенос счётчиков кликов из links[].clicks в link_clicks
--
-- Раньше клики лежали внутри links — том самом jsonb, который владелец целиком
-- перезаписывает при сохранении из дашборда. Это откатывало счётчики назад
-- и позволяло владельцу подкручивать свою статистику.
-- Шаг выполняется только для строк, где link_clicks ещё пуст.
-- ---------------------------------------------------------------------
update public.profiles p
set link_clicks = coalesce((
      select jsonb_object_agg(
               l->>'id',
               case when (l->>'clicks') ~ '^[0-9]{1,15}$' then (l->>'clicks')::bigint else 0 end
             )
      from jsonb_array_elements(p.links) as l
      where jsonb_typeof(l) = 'object' and (l->>'id') is not null
    ), '{}'::jsonb)
where jsonb_typeof(p.links) = 'array'
  and p.link_clicks = '{}'::jsonb;

-- Убираем clicks из самих ссылок (порядок элементов сохраняем).
update public.profiles p
set links = coalesce((
      select jsonb_agg(
               case when jsonb_typeof(t.l) = 'object' then t.l - 'clicks' else t.l end
               order by t.ord
             )
      from jsonb_array_elements(p.links) with ordinality as t(l, ord)
    ), '[]'::jsonb)
where jsonb_typeof(p.links) = 'array'
  and p.links::text like '%"clicks"%';

-- ---------------------------------------------------------------------
-- 3. Ники: уникальность и формат
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'profiles'
      and indexdef ilike 'create unique index%(username)%'
  ) then
    if exists (select 1 from public.profiles group by username having count(*) > 1) then
      raise notice 'Пропущен unique-индекс на username: в таблице есть дубликаты (см. 000_preflight.sql, запрос 7).';
    else
      create unique index profiles_username_unique on public.profiles (username);
    end if;
  end if;

  if exists (select 1 from public.profiles where username !~ '^[a-z0-9_]{2,64}$') then
    raise notice 'Пропущено ограничение формата username: есть нарушающие ники (см. 000_preflight.sql, запрос 6).';
  else
    alter table public.profiles drop constraint if exists profiles_username_format;
    alter table public.profiles add constraint profiles_username_format
      check (username ~ '^[a-z0-9_]{2,64}$');
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 4. ГЛАВНОЕ: привилегированные колонки нельзя писать с клиента
--
-- Приложение пишет в profiles напрямую из браузера, а админка проверяла is_admin
-- только в UI. RLS работает по строкам, а не по колонкам, поэтому политика
-- «обновлять свою строку» позволяла любому юзеру выставить себе is_admin = true,
-- снять is_banned или накрутить views прямо из консоли.
-- Права на колонки (column-level GRANT) действуют независимо от политик RLS.
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

revoke insert, update, delete, truncate, references, trigger on public.profiles from anon, authenticated;

grant insert (id, username, display_name, bio, avatar_url, theme_config, links)
  on public.profiles to authenticated;
grant update (username, display_name, bio, avatar_url, theme_config, links)
  on public.profiles to authenticated;

drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public" on public.profiles
  for select using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- Забаненный пользователь не может править свой профиль (убери проверку is_banned в using, если не нужно).
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id and coalesce(is_banned, false) = false)
  with check (auth.uid() = id);

-- ВАЖНО: другие, ранее созданные политики на profiles этот файл НЕ удаляет.
-- Если в 000_preflight.sql (запрос 1) есть что-то ещё на INSERT/UPDATE/DELETE/ALL —
-- проверь вручную. Права на колонки всё равно защищают is_admin/is_banned/views/link_clicks,
-- но лишние политики могут дать доступ к чужим строкам.

-- ---------------------------------------------------------------------
-- 5. Админские действия — только через RPC с проверкой на сервере
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.admin_set_flag(target uuid, flag text, val boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'you cannot change your own flags' using errcode = '42501';
  end if;
  if flag = 'is_banned' then
    update public.profiles set is_banned = val where id = target;
  elsif flag = 'is_admin' then
    update public.profiles set is_admin = val where id = target;
  else
    raise exception 'unknown flag' using errcode = '22023';
  end if;
end
$$;

create or replace function public.admin_update_profile(target uuid, new_username text, new_views bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if new_username is null or new_username !~ '^[a-z0-9_]{2,24}$' then
    raise exception 'invalid username' using errcode = '23514';
  end if;
  update public.profiles
     set username = new_username,
         views = greatest(coalesce(new_views, 0), 0)
   where id = target;
end
$$;

create or replace function public.admin_delete_profile(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'you cannot delete yourself' using errcode = '42501';
  end if;
  delete from public.profiles where id = target;
end
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.admin_set_flag(uuid, text, boolean) from public, anon;
revoke all on function public.admin_update_profile(uuid, text, bigint) from public, anon;
revoke all on function public.admin_delete_profile(uuid) from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.admin_set_flag(uuid, text, boolean) to authenticated;
grant execute on function public.admin_update_profile(uuid, text, bigint) to authenticated;
grant execute on function public.admin_delete_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Счётчики: клики и просмотры
--
-- Если в 000_preflight.sql (запрос 4) сигнатуры этих функций отличаются от (text)/(text,text),
-- удали старые вручную: drop function public.имя(старые_типы);
-- Иначе PostgREST не сможет выбрать между перегрузками.
-- ---------------------------------------------------------------------
drop function if exists public.increment_link_click(text, text);
drop function if exists public.increment_views(text);

-- Клик: одним атомарным UPDATE (без гонок), только по существующей ссылке этого профиля.
create function public.increment_link_click(profile_username text, target_link_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_link_id is null or length(target_link_id) > 64 then
    return;
  end if;

  update public.profiles p
     set link_clicks = jsonb_set(
           coalesce(p.link_clicks, '{}'::jsonb),
           array[target_link_id],
           to_jsonb(
             coalesce(
               case when (p.link_clicks ->> target_link_id) ~ '^[0-9]{1,15}$'
                    then (p.link_clicks ->> target_link_id)::bigint end,
               0
             ) + 1
           ),
           true
         )
   where p.username = lower(profile_username)
     and coalesce(p.is_banned, false) = false
     and case
           when jsonb_typeof(p.links) = 'array' then exists (
             select 1
             from jsonb_array_elements(p.links) as l
             where jsonb_typeof(l) = 'object'
               and l ->> 'id' = target_link_id
               and coalesce(l ->> 'type', 'link') <> 'header'
           )
           else false
         end;
end
$$;

-- Просмотры: не чаще одного раза в сутки с одного посетителя (IP + User-Agent).
-- Если заголовка с IP нет, считаем как раньше — без дедупликации.
create table if not exists public.view_log (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  visitor    text not null,
  day        date not null default current_date,
  primary key (profile_id, visitor, day)
);
alter table public.view_log enable row level security;
revoke all on public.view_log from anon, authenticated;
-- Политик нет намеренно: таблицу трогает только security definer-функция ниже.

create function public.increment_views(profile_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pid   uuid;
  h     json;
  ip    text;
  vis   text;
  fresh boolean := true;
begin
  select id into pid
    from public.profiles
   where username = lower(profile_username) and coalesce(is_banned, false) = false;
  if pid is null then
    return;
  end if;

  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    h := null;
  end;

  ip := coalesce(
          nullif(h ->> 'cf-connecting-ip', ''),
          nullif(split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1), '')
        );

  if ip is not null then
    vis := md5(ip || '|' || coalesce(h ->> 'user-agent', ''));
    insert into public.view_log (profile_id, visitor) values (pid, vis)
      on conflict do nothing;
    fresh := found;  -- true только если строка реально вставлена (новый посетитель за сегодня)
  end if;

  if fresh then
    update public.profiles set views = coalesce(views, 0) + 1 where id = pid;
  end if;
end
$$;

revoke all on function public.increment_link_click(text, text) from public;
revoke all on function public.increment_views(text) from public;
grant execute on function public.increment_link_click(text, text) to anon, authenticated;
grant execute on function public.increment_views(text) to anon, authenticated;

-- view_log растёт. Чисть раз в сутки (нужно расширение pg_cron, Database → Extensions):
--   select cron.schedule('eidos-view-log-prune', '15 3 * * *',
--                        $$delete from public.view_log where day < current_date - 1$$);

-- ---------------------------------------------------------------------
-- 7. Создание профиля при регистрации — триггером, а не из браузера
--
-- Из браузера это ломалось при включённом подтверждении почты (нет сессии →
-- insert идёт как anon → RLS отказывает), а выбранный ник терялся.
-- Ник берётся из user_metadata.username (его передаёт форма регистрации).
-- Список зарезервированных имён зеркалит src/lib/username.js.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reserved text[] := array[
    'admin','explore','login','logout','register','signup','signin','settings','api','auth',
    'eidos','support','help','about','privacy','terms','dashboard','assets','static','public',
    'favicon','robots','sitemap','me','null','undefined'
  ];
  wanted   text;
  uname    text;
  fallback text;
  chosen   boolean := false;
  disp     text;
  theme    jsonb;
  lnk      jsonb := '[]'::jsonb;
begin
  wanted := left(
              regexp_replace(lower(coalesce(new.raw_user_meta_data ->> 'username', '')), '[^a-z0-9_]', '', 'g'),
              24
            );
  fallback := 'user_' || left(replace(new.id::text, '-', ''), 10);

  if length(wanted) >= 3 and not (wanted = any (reserved)) then
    uname := wanted;
    chosen := true;
  else
    uname := fallback;
  end if;

  disp := left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), uname), 50);

  theme := jsonb_build_object(
    'themeKey', 'obsidian', 'bgEffect', 'eidos', 'font', 'Inter',
    'cardRadius', 12, 'badge', '', 'status', 'online', 'socials', '[]'::jsonb
  );

  if chosen then
    theme := jsonb_set(theme, '{socials}',
               jsonb_build_array(jsonb_build_object('id', '1', 'platform', 'Discord', 'value', uname)));
    lnk := jsonb_build_array(jsonb_build_object(
             'id', substr(md5(random()::text || clock_timestamp()::text), 1, 12),
             'type', 'link', 'platform', 'Telegram', 'title', 'Telegram',
             'subtitle', '@' || uname, 'url', 'https://t.me/',
             'visible', true, 'color', '#38bdf8', 'featured', false));
  end if;

  begin
    insert into public.profiles (id, username, display_name, bio, avatar_url, theme_config, links)
    values (new.id, uname, disp, '', '', theme, lnk)
    on conflict (id) do nothing;
  exception when unique_violation then
    -- Ник успели занять между проверкой в форме и регистрацией: берём запасной.
    insert into public.profiles (id, username, display_name, bio, avatar_url, theme_config, links)
    values (new.id, fallback, left(fallback, 50), '', '',
            jsonb_set(theme, '{socials}', '[]'::jsonb), '[]'::jsonb)
    on conflict (id) do nothing;
  end;

  return new;
end
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 8. Хранилище картинок
--
-- Бакет 'media': публичное чтение по ссылке, загрузка/удаление только в свою папку
-- <user_id>/…, только JPEG до 2 МБ (клиент и так сжимает в JPEG ~50–300 КБ).
-- Если ты используешь этот бакет для чего-то ещё — поправь mime-типы и лимит.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2097152, array['image/jpeg'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg'];

drop policy if exists "media_select_own" on storage.objects;
create policy "media_select_own" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media_insert_own" on storage.objects;
create policy "media_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "media_delete_own" on storage.objects;
create policy "media_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

commit;

-- =====================================================================
-- ПРОВЕРКА ПОСЛЕ ПРИМЕНЕНИЯ (под обычным, не админским аккаунтом, из консоли браузера
-- на любой странице с подключённым supabase-клиентом, либо через REST):
--
--   update profiles set is_admin = true where id = '<твой uuid>'
--     → должно вернуть ошибку "permission denied for table profiles" (42501)
--   update profiles set views = 999999 where id = '<твой uuid>'
--     → то же самое
--   rpc('admin_set_flag', { target: '<чужой uuid>', flag: 'is_banned', val: true })
--     → "forbidden"
--
-- ОТКАТ (если что-то пошло не так и нужно срочно вернуть как было):
--   grant insert, update, delete on public.profiles to anon, authenticated;
--   drop trigger if exists on_auth_user_created on auth.users;
-- (Это снимет защиту. Возвращай только временно.)
-- =====================================================================
