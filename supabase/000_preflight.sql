-- =====================================================================
-- 000_preflight.sql — ТОЛЬКО ЧТЕНИЕ. Ничего не меняет.
-- Запусти по одному запросу в Supabase → SQL Editor и посмотри результат
-- ДО применения 001_eidos_hardening.sql.
-- =====================================================================

-- 1. Какие политики RLS сейчас стоят на profiles?
--    Ищи: политики для роли public/anon на UPDATE/ALL/INSERT, а также любые,
--    где в условии нет проверки auth.uid() = id. Такие надо понять и, скорее всего, удалить.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by cmd, policyname;

-- 2. Включён ли RLS на profiles?
select relname, relrowsecurity as rls_enabled
from pg_class
where oid = 'public.profiles'::regclass;

-- 3. Какие права сейчас у anon/authenticated на profiles (в т.ч. по колонкам)?
select grantee, privilege_type, is_grantable
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'profiles' and grantee in ('anon', 'authenticated')
order by grantee, privilege_type;

-- 4. Текущие определения функций, которые приложение вызывает.
--    001 их заменит. Если сигнатура отличается от (text) / (text, text) — смотри комментарий в 001.
select p.oid::regprocedure as signature, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('increment_views', 'increment_link_click', 'is_admin',
                    'admin_set_flag', 'admin_update_profile', 'admin_delete_profile', 'handle_new_user');

-- 5. Триггеры на auth.users (если там уже есть триггер, создающий профиль, второй не нужен).
select tgname, pg_get_triggerdef(oid) as definition
from pg_trigger
where tgrelid = 'auth.users'::regclass and not tgisinternal;

-- 6. Ники, которые нарушат формат ^[a-z0-9_]{2,64}$ (001 не добавит ограничение, пока такие есть).
select id, username
from public.profiles
where username !~ '^[a-z0-9_]{2,64}$';

-- 7. Дубликаты ников (помешают уникальному индексу).
select username, count(*)
from public.profiles
group by username
having count(*) > 1;

-- 8. Строки, где links — не массив (001 такие аккуратно пропустит, но полезно знать).
select id, username, jsonb_typeof(links) as links_type
from public.profiles
where jsonb_typeof(links) is distinct from 'array';

-- 9. Политики на storage.objects (ищи что-то вроде "anyone can upload").
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- 10. Сколько строк с огромными base64-аватарами (наследие silent-fallback при загрузке)?
select count(*) as rows_with_base64_media
from public.profiles
where avatar_url like 'data:%' or theme_config->>'bannerUrl' like 'data:%';
