import test from 'node:test';
import assert from 'node:assert/strict';
import { loadOrCreateProfile } from '../src/lib/profileService.js';
import { staleMediaPaths } from '../src/lib/media.js';

// Минимальная in-memory «БД» с тем же интерфейсом, что нужен сервису.
function fakeSupabase({ rows = [], readError = null, insertErrors = [], onInsert } = {}) {
  const log = [];
  return {
    log,
    rows,
    from: () => ({
      select: () => ({
        eq: (col, val) => ({
          maybeSingle: async () => {
            log.push('read');
            if (readError) return { data: null, error: readError };
            return { data: rows.find((r) => r[col] === val) ?? null, error: null };
          }
        })
      }),
      insert: async (row) => {
        log.push(['insert', row.username]);
        if (onInsert) onInsert(row);
        const err = insertErrors.shift();
        if (err) return { error: err };
        rows.push({ ...row, views: 0, is_admin: false, is_banned: false, link_clicks: {} });
        return { error: null };
      }
    })
  };
}
const UID = 'abcdef12-0000-0000-0000-000000000000';
const user = (username) => ({ id: UID, user_metadata: username ? { username } : {} });

test('профиль уже есть → возвращаем, ничего не вставляем', async () => {
  const db = fakeSupabase({ rows: [{ id: UID, username: 'neo' }] });
  const r = await loadOrCreateProfile(db, user('other'));
  assert.equal(r.profile.username, 'neo');
  assert.deepEqual(db.log, ['read']);
});

test('профиля нет → создаётся с ником из регистрации и перечитывается (с дефолтами БД)', async () => {
  const db = fakeSupabase();
  const r = await loadOrCreateProfile(db, user('Neo_1'));
  assert.equal(r.profile.username, 'neo_1');
  assert.equal(r.profile.views, 0, 'должны прийти значения по умолчанию из БД, а не клиентская заготовка');
  assert.equal(r.profile.is_admin, false);
  assert.deepEqual(db.log.map((x) => (Array.isArray(x) ? x[0] : x)), ['read', 'insert', 'read']);
});

test('клиент вставляет ТОЛЬКО колонки, разрешённые GRANT-ом (иначе permission denied)', async () => {
  const allowed = new Set(['id', 'username', 'display_name', 'bio', 'avatar_url', 'theme_config', 'links']);
  let inserted;
  await loadOrCreateProfile(fakeSupabase({ onInsert: (row) => (inserted = row) }), user('neo'));
  for (const k of Object.keys(inserted)) assert.ok(allowed.has(k), `колонка ${k} не разрешена в GRANT`);
});

test('гонка: параллельно создали профиль (23505) → берём созданный, второй insert не делаем', async () => {
  const db = fakeSupabase({ insertErrors: [{ code: '23505' }] });
  // между первым чтением и повторным «кто-то» создал строку
  db.from = () => ({
    select: fakeSupabase({ rows: db.rows }).from().select,
    insert: async (row) => {
      db.log.push(['insert', row.username]);
      db.rows.push({ id: UID, username: 'created_by_trigger' });
      return { error: { code: '23505' } };
    }
  });
  const r = await loadOrCreateProfile(db, user('neo'));
  assert.equal(r.profile.username, 'created_by_trigger');
  assert.equal(db.log.filter((x) => Array.isArray(x)).length, 1, 'ровно одна попытка вставки');
});

test('ник занят (23505, профиля нет) → вторая попытка с запасным user_xxxxxx', async () => {
  const db = fakeSupabase({ insertErrors: [{ code: '23505' }] });
  const r = await loadOrCreateProfile(db, user('neo'));
  assert.equal(r.profile.username, 'user_abcdef');
  const inserts = db.log.filter((x) => Array.isArray(x)).map((x) => x[1]);
  assert.deepEqual(inserts, ['neo', 'user_abcdef']);
});

test('ошибка чтения → { error }, вставки нет', async () => {
  const db = fakeSupabase({ readError: { code: 'PGRST301', message: 'JWT expired' } });
  const r = await loadOrCreateProfile(db, user('neo'));
  assert.equal(r.error.message, 'JWT expired');
  assert.equal(r.profile, undefined);
  assert.deepEqual(db.log, ['read']);
});

test('другая ошибка вставки (не 23505, например RLS) → { error }, а не молчаливый «успех»', async () => {
  // раньше клиент игнорировал ошибку insert и показывал профиль, которого нет в БД
  const db = fakeSupabase({ insertErrors: [{ code: '42501', message: 'row-level security' }] });
  const r = await loadOrCreateProfile(db, user('neo'));
  assert.equal(r.error.code, '42501');
  assert.equal(r.profile, undefined);
});

test('staleMediaPaths: заменённая сохранённая картинка удаляется', () => {
  const base = 'https://x.supabase.co/storage/v1/object/public/media/u1/';
  const out = staleMediaPaths({
    saved: { avatar: `${base}avatar_1.jpg`, banner: '' },
    pending: { avatar: { path: 'u1/avatar_2.jpg', url: `${base}avatar_2.jpg` } },
    now: { avatar: `${base}avatar_2.jpg`, banner: '' },
    userId: 'u1'
  });
  assert.deepEqual(out, ['u1/avatar_1.jpg']);
});

test('staleMediaPaths: загрузили, но в профиль поставили другую ссылку → висячая загрузка удаляется', () => {
  const base = 'https://x.supabase.co/storage/v1/object/public/media/u1/';
  const out = staleMediaPaths({
    saved: { avatar: '', banner: '' },
    pending: { avatar: { path: 'u1/avatar_9.jpg', url: `${base}avatar_9.jpg` } },
    now: { avatar: 'https://cdn.discordapp.com/a.png', banner: '' },
    userId: 'u1'
  });
  assert.deepEqual(out, ['u1/avatar_9.jpg']);
});

test('staleMediaPaths: без изменений, чужие и внешние файлы — ничего не удаляем', () => {
  const mine = 'https://x.supabase.co/storage/v1/object/public/media/u1/a.jpg';
  assert.deepEqual(staleMediaPaths({ saved: { avatar: mine }, pending: {}, now: { avatar: mine }, userId: 'u1' }), []);
  assert.deepEqual(staleMediaPaths({
    saved: { avatar: 'https://x.supabase.co/storage/v1/object/public/media/u2/a.jpg', banner: 'https://cdn.x/b.png' },
    pending: {}, now: { avatar: '', banner: '' }, userId: 'u1'
  }), [], 'чужую папку и внешние URL трогать нельзя');
  assert.deepEqual(staleMediaPaths({ saved: undefined, pending: undefined, now: undefined, userId: 'u1' }), []);
});
