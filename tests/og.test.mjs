import test from 'node:test';
import assert from 'node:assert/strict';
import { BOT_UA, escapeHtml, renderProfileHtml, profileMetaResponse } from '../edge/og.js';

const ENV = { SUPABASE_URL: 'https://x.supabase.co/', SUPABASE_ANON_KEY: 'k' };
const fakeFetch = (rows, { ok = true, calls = [] } = {}) => async (url, init) => {
  calls.push({ url, init });
  return { ok, json: async () => rows };
};
const call = (pathname, rows, extra = {}) =>
  profileMetaResponse({ pathname, origin: 'https://eidos.test', env: ENV, fetchImpl: fakeFetch(rows, extra), ...extra.opts });

test('BOT_UA: боты-превьюшники — да, живые браузеры и встроенные — нет', () => {
  for (const ua of [
    'TelegramBot (like TwitterBot)', 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    'vkShare; +http://vk.com/dev/Share', 'Twitterbot/1.0', 'Slackbot-LinkExpanding 1.0',
    'facebookexternalhit/1.1', 'WhatsApp/2.23.20 A', 'Mozilla/5.0 (compatible; Googlebot/2.1)'
  ]) assert.ok(BOT_UA.test(ua), `должен считаться ботом: ${ua}`);

  for (const ua of [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36 Telegram-Android/10.9.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 300.0',
    'Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile Safari VKApp/7.40', 'Mozilla/5.0 Viber/21.0'
  ]) assert.ok(!BOT_UA.test(ua), `живой человек, не бот: ${ua}`);
});

test('escapeHtml экранирует всё опасное', () => {
  assert.equal(escapeHtml(`<script>"'&`), '&lt;script&gt;&quot;&#39;&amp;');
  assert.equal(escapeHtml(null), '');
});

test('renderProfileHtml: XSS в имени/био не проходит, og-теги на месте', () => {
  const html = renderProfileHtml(
    { username: 'neo', display_name: '<img src=x onerror=alert(1)>', bio: '"><script>alert(1)</script>', avatar_url: 'https://cdn.a/b.png' },
    'https://eidos.test'
  );
  assert.ok(!html.includes('<script>') && !html.includes('<img src=x'), 'сырой HTML просочился');
  assert.match(html, /property="og:title" content="&lt;img src=x onerror=alert\(1\)&gt; \(@neo\) — MORPHE"/);
  assert.match(html, /property="og:image" content="https:\/\/cdn\.a\/b\.png"/);
  assert.match(html, /name="twitter:card" content="summary_large_image"/);
  assert.match(html, /rel="canonical" href="https:\/\/eidos\.test\/neo"/);
});

test('renderProfileHtml: не-https и мусорные аватары не попадают в og:image', () => {
  for (const bad of ['http://a.com/x.png', 'javascript:alert(1)', 'data:image/png;base64,AAA', '', null]) {
    const html = renderProfileHtml({ username: 'neo', display_name: 'N', bio: '', avatar_url: bad }, 'https://e.t');
    assert.ok(!html.includes('og:image'), `og:image не должен быть для ${bad}`);
    assert.match(html, /twitter:card" content="summary"/);
  }
});

test('renderProfileHtml: длинное био обрезается, пустое → запасной текст', () => {
  const long = renderProfileHtml({ username: 'neo', display_name: 'N', bio: 'a'.repeat(500) }, 'https://e.t');
  assert.match(long, /og:description" content="a{199}…"/);
  assert.match(renderProfileHtml({ username: 'neo', display_name: 'N', bio: '' }, 'https://e.t'), /@neo on MORPHE/);
});

test('profileMetaResponse: нормальный профиль → 200 html, ник кодируется в запросе', async () => {
  const calls = [];
  const res = await call('/Neo', [{ username: 'neo', display_name: 'Neo', bio: 'hi', avatar_url: '', is_banned: false }], { calls });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  assert.match(await res.text(), /og:title/);
  assert.match(calls[0].url, /^https:\/\/x\.supabase\.co\/rest\/v1\/profiles\?select=.*&username=eq\.neo&limit=1$/);
  assert.equal(calls[0].init.headers.apikey, 'k');
});

test('profileMetaResponse: всё, что не профиль, возвращает null (адаптер отдаст SPA)', async () => {
  const row = [{ username: 'neo', display_name: 'N', is_banned: false }];
  for (const path of ['/', '/explore', '/admin', '/a/b', '/neo/extra', '/x', '/%E0%A4%A', '/ne o', '/favicon.ico', '/neo;drop', '/' + 'a'.repeat(65)]) {
    assert.equal(await call(path, row), null, `должен быть null: ${path}`);
  }
});

test('profileMetaResponse: нет профиля / бан / ошибка сети / нет env → null', async () => {
  assert.equal(await call('/ghost', []), null);
  assert.equal(await call('/neo', [{ username: 'neo', is_banned: true }]), null);
  assert.equal(await call('/neo', [], { ok: false }), null);
  const boom = await profileMetaResponse({ pathname: '/neo', origin: 'https://e.t', env: ENV, fetchImpl: async () => { throw new Error('net'); } });
  assert.equal(boom, null);
  assert.equal(await profileMetaResponse({ pathname: '/neo', origin: 'https://e.t', env: {}, fetchImpl: fakeFetch([{ username: 'neo' }]) }), null);
});

test('profileMetaResponse: инъекция в фильтр PostgREST невозможна', async () => {
  const calls = [];
  const res = await call('/neo&is_admin=eq.true', [{ username: 'neo' }], { calls });
  assert.equal(res, null);
  assert.equal(calls.length, 0, 'к БД не должны были обращаться');
});
