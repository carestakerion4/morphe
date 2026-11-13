import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeUsername, validateUsername, fallbackUsername, RESERVED_USERNAMES } from '../src/lib/username.js';
import { normalizeLinkUrl, toSafeHttpUrl } from '../src/lib/urls.js';
import {
  getClicks, sumClicks, stripClicks, usesSeparateClicks, asLinks, asSocials,
  buildInitialProfile, newBlockId
} from '../src/lib/profile.js';
import { fitSize, squareCrop, mediaPathFromUrl, validateImageFile } from '../src/lib/media.js';

test('sanitizeUsername: регистр, мусор, длина', () => {
  assert.equal(sanitizeUsername('Cool-Name 123!'), 'coolname123');
  assert.equal(sanitizeUsername('A'.repeat(50)).length, 24);
  assert.equal(sanitizeUsername(null), '');
  assert.equal(sanitizeUsername('имя'), '');
});

test('validateUsername: длина, символы, зарезервированные', () => {
  assert.equal(validateUsername('neo'), '');
  assert.match(validateUsername('ab'), /at least 3/);
  assert.match(validateUsername('x'.repeat(25)), /at most 24/);
  assert.match(validateUsername('Neo'), /only/);
  assert.match(validateUsername('admin'), /reserved/);
  for (const r of ['explore', 'admin', 'assets', 'privacy']) assert.ok(RESERVED_USERNAMES.includes(r));
});

test('fallbackUsername', () => {
  assert.equal(fallbackUsername('1234abcd-0000-1111-2222-333344445555'), 'user_1234ab');
});

test('normalizeLinkUrl: нормальные ссылки', () => {
  assert.equal(normalizeLinkUrl('t.me/neo'), 'https://t.me/neo');
  assert.equal(normalizeLinkUrl('  https://example.com/a?b=1 '), 'https://example.com/a?b=1');
  assert.equal(normalizeLinkUrl('HTTP://Example.com'), 'http://example.com/');
  assert.equal(normalizeLinkUrl('example.com:8080/x'), 'https://example.com:8080/x');
});

test('normalizeLinkUrl: опасные и мусорные вводы отбиваются', () => {
  for (const bad of [
    'javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,<script>1</script>',
    'vbscript:x', 'mailto:a@b.c', 'file:///etc/passwd', '', '   ', 'просто текст',
    'localhost:3000', 'https://', 'https://nodot', 'x'.repeat(3000)
  ]) {
    assert.equal(normalizeLinkUrl(bad), null, `должен отбить: ${bad.slice(0, 30)}`);
  }
});

test('баг оригинала: "httpfoo.com" больше не считается готовой ссылкой', () => {
  // раньше startsWith("http") пропускал это как есть, и ссылка ломалась
  assert.equal(normalizeLinkUrl('httpfoo.com'), 'https://httpfoo.com/');
});

test('toSafeHttpUrl', () => {
  assert.equal(toSafeHttpUrl('https://a.com/x'), 'https://a.com/x');
  assert.equal(toSafeHttpUrl('javascript:alert(1)'), undefined);
  assert.equal(toSafeHttpUrl('data:image/png;base64,AAAA'), undefined);
  assert.equal(toSafeHttpUrl(undefined), undefined);
  assert.equal(toSafeHttpUrl('not a url'), undefined);
});

test('клики: новая и старая схема', () => {
  const links = [{ id: 'a', clicks: 7 }, { id: 'b' }, { id: 'h', type: 'header' }];
  const legacy = { links };
  assert.equal(getClicks(legacy, links[0]), 7);
  assert.equal(usesSeparateClicks(legacy), false);
  const modern = { links, link_clicks: { a: 3, b: 5, h: 99 } };
  assert.equal(usesSeparateClicks(modern), true);
  assert.equal(getClicks(modern, links[0]), 3); // link_clicks приоритетнее старого поля
  assert.equal(getClicks(modern, { id: 'zzz' }), 0);
  assert.equal(sumClicks(modern), 8); // header не считается
  assert.equal(getClicks({ link_clicks: { a: 'мусор' } }, { id: 'a' }), 0);
});

test('stripClicks убирает только clicks и не мутирует', () => {
  const src = [{ id: 'a', title: 'T', clicks: 4 }];
  const out = stripClicks(src);
  assert.deepEqual(out, [{ id: 'a', title: 'T' }]);
  assert.equal(src[0].clicks, 4);
});

test('asLinks / asSocials переживают мусор из БД', () => {
  assert.deepEqual(asLinks({ links: 'oops' }), []);
  assert.deepEqual(asLinks({ links: [null, 5, { id: 1 }] }), [{ id: 1 }]);
  const socials = asSocials({ theme_config: { socials: [{ value: 'a' }, { value: undefined }, null, { value: '' }] } });
  assert.deepEqual(socials, [{ value: 'a' }]);
  assert.deepEqual(asSocials({}), []);
});

test('buildInitialProfile: ник из metadata, запасной при плохом/занятом', () => {
  const id = 'abcdef12-0000-0000-0000-000000000000';
  assert.equal(buildInitialProfile({ id, user_metadata: { username: 'Neo_1' } }).username, 'neo_1');
  assert.equal(buildInitialProfile({ id, user_metadata: { username: 'admin' } }).username, 'user_abcdef');
  assert.equal(buildInitialProfile({ id, user_metadata: { username: 'ab' } }).username, 'user_abcdef');
  assert.equal(buildInitialProfile({ id, user_metadata: { username: 'neo' } }, { taken: true }).username, 'user_abcdef');
  assert.equal(buildInitialProfile({ id }).username, 'user_abcdef');
  const p = buildInitialProfile({ id, user_metadata: { username: 'neo' } });
  assert.ok(!('views' in p) && !('is_admin' in p), 'клиент не должен слать привилегированные поля');
  // выбранный при регистрации ник -> стартовый контент, как в оригинале
  assert.equal(p.links.length, 1);
  assert.equal(p.links[0].subtitle, '@neo');
  assert.equal(p.theme_config.socials[0].value, 'neo');
  // запасной ник -> пустой профиль, как в оригинале
  const fb = buildInitialProfile({ id }, {});
  assert.deepEqual(fb.links, []);
  assert.deepEqual(fb.theme_config.socials, []);
  // DEFAULT_THEME_CONFIG не должен мутировать между вызовами
  p.theme_config.socials.push({ x: 1 });
  assert.deepEqual(buildInitialProfile({ id }).theme_config.socials, []);
});

test('newBlockId уникален', () => {
  const ids = new Set(Array.from({ length: 500 }, newBlockId));
  assert.equal(ids.size, 500);
});

test('fitSize / squareCrop', () => {
  assert.deepEqual(fitSize(4000, 2000, 1200, 1200), { width: 1200, height: 600 });
  assert.deepEqual(fitSize(400, 8000, 1200, 1600), { width: 80, height: 1600 }); // высокая картинка тоже ограничена
  assert.deepEqual(fitSize(100, 50, 1200, 1200), { width: 100, height: 50 }); // без увеличения
  assert.deepEqual(squareCrop(300, 200), { sx: 50, sy: 0, size: 200 });
});

test('mediaPathFromUrl: удаляем только своё', () => {
  const uid = 'u-1';
  const base = 'https://x.supabase.co/storage/v1/object/public/media/';
  assert.equal(mediaPathFromUrl(`${base}u-1/avatar_1.jpg?v=2`, uid), 'u-1/avatar_1.jpg');
  assert.equal(mediaPathFromUrl(`${base}u-2/avatar_1.jpg`, uid), null); // чужая папка
  assert.equal(mediaPathFromUrl(`${base}u-1/../u-2/a.jpg`, uid), null);
  assert.equal(mediaPathFromUrl('https://cdn.discordapp.com/a.png', uid), null);
  assert.equal(mediaPathFromUrl(undefined, uid), null);
});

test('validateImageFile', () => {
  assert.equal(validateImageFile({ type: 'image/png', size: 1000 }), '');
  assert.match(validateImageFile({ type: 'application/pdf', size: 10 }), /JPG/);
  assert.match(validateImageFile({ type: 'image/png', size: 9 * 1024 * 1024 }), /8 MB/);
  assert.match(validateImageFile(null), /No file/);
});
