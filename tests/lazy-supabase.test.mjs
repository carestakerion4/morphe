// Регрессионная защита от «ленивых» вызовов.
//
// Билдеры postgrest-js (supabase.from(...), supabase.rpc(...)) отправляют запрос только
// на .then()/await. Вызов «в пустоту» вроде
//     supabase.rpc('increment_link_click', {...});
// не делает НИЧЕГО — именно так клики по ссылкам никогда не считались.
// Тест находит такие вызовы в src/ статически.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = process.env.SRC_DIR || fileURLToPath(new URL('../src', import.meta.url));

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return listFiles(p);
    return /\.(jsx?|mjs)$/.test(d.name) ? [p] : [];
  });
}

/** Начало вызова supabase.from( / supabase.rpc( (но не supabase.storage.from — там обычные промисы). */
const CALL_RE = /\bsupabase\s*\.\s*(?:from|rpc)\(/g;

export function findLazyCalls(source) {
  const bad = [];
  let m;
  while ((m = CALL_RE.exec(source))) {
    // Что стоит перед вызовом в этом же операторе?
    let i = m.index - 1;
    while (i >= 0 && !';{}'.includes(source[i])) i--;
    const before = source.slice(i + 1, m.index).replace(/\/\/.*$/gm, '').trim();

    // Конец оператора: первая «;» на нулевой глубине скобок.
    let depth = 0;
    let j = m.index;
    for (; j < source.length; j++) {
      const c = source[j];
      if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth--;
      else if (c === ';' && depth <= 0) break;
    }
    const statement = source.slice(m.index, j);

    const startsStatement = before === '';
    if (startsStatement && !/\.then\(/.test(statement)) {
      const line = source.slice(0, m.index).split('\n').length;
      bad.push({ line, code: statement.split('\n')[0].trim() });
    }
  }
  return bad;
}

test('каждый вызов supabase.from()/rpc() реально исполняется (await / .then / присваивание)', () => {
  const problems = [];
  for (const file of listFiles(SRC)) {
    for (const b of findLazyCalls(fs.readFileSync(file, 'utf8'))) {
      problems.push(`${path.relative(SRC, file)}:${b.line}  ${b.code}`);
    }
  }
  assert.deepEqual(problems, [], `Вызовы без await/.then ничего не отправляют:\n${problems.join('\n')}`);
});

test('детектор сам работает: находит «пустой» вызов и пропускает корректные', () => {
  assert.equal(findLazyCalls(`supabase.rpc('x', {a:1});`).length, 1);
  assert.equal(findLazyCalls(`supabase\n  .rpc('x', {a:1});`).length, 1);
  assert.equal(findLazyCalls(`await supabase.rpc('x');`).length, 0);
  assert.equal(findLazyCalls(`supabase.rpc('x').then(() => {}, () => {});`).length, 0);
  assert.equal(findLazyCalls(`const { data } = await supabase.from('t').select();`).length, 0);
  assert.equal(findLazyCalls(`let q = supabase.from('t').select(); q = q.eq('a', 1);`).length, 0);
  assert.equal(findLazyCalls(`Promise.all([supabase.from('t').select(), 1]);`).length, 0);
  assert.equal(findLazyCalls(`supabase.storage.from('media').remove(['a']);`).length, 0);
});
