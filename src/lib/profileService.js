// Загрузка/создание профиля. Клиент Supabase передаётся параметром — логика тестируется без сети.
import { buildInitialProfile } from './profile.js';

/**
 * Читает профиль пользователя; если его нет (не создал триггер, или подтверждали почту) —
 * создаёт из user_metadata, чтобы выбранный при регистрации ник не терялся.
 *
 * Возвращает { profile } или { error }.
 */
export async function loadOrCreateProfile(supabase, user) {
  const read = () => supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

  const first = await read();
  if (first.error) return { error: first.error };
  if (first.data) return { profile: first.data };

  let candidate = buildInitialProfile(user);
  let ins = await supabase.from('profiles').insert(candidate);

  if (ins.error && ins.error.code === '23505') {
    // Либо профиль успели создать параллельно (триггер, вторая вкладка), либо ник занят.
    const again = await read();
    if (again.data) return { profile: again.data };
    candidate = buildInitialProfile(user, { taken: true });
    ins = await supabase.from('profiles').insert(candidate);
  }
  if (ins.error) return { error: ins.error };

  // Перечитываем строку, чтобы получить значения по умолчанию (views, is_admin, link_clicks…).
  const created = await read();
  return { profile: created.data || candidate };
}
