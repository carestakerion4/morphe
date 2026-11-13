// Правила хэндлов. Зеркалятся в SQL (supabase/001_eidos_hardening.sql) —
// если меняешь здесь, меняй и там.

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 24;

// Статические роуты и служебные пути, которые нельзя занять как профиль.
export const RESERVED_USERNAMES = [
  'admin', 'explore', 'login', 'logout', 'register', 'signup', 'signin', 'settings',
  'api', 'auth', 'eidos', 'support', 'help', 'about', 'privacy', 'terms', 'dashboard',
  'assets', 'static', 'public', 'favicon', 'robots', 'sitemap', 'me', 'null', 'undefined'
];

/** Приводит ввод к виду [a-z0-9_] нижним регистром, обрезает до USERNAME_MAX. */
export function sanitizeUsername(raw) {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, USERNAME_MAX);
}

/**
 * Возвращает текст ошибки или '' если хэндл допустим.
 * Принимает уже очищенный хэндл (после sanitizeUsername).
 */
export function validateUsername(username, { min = USERNAME_MIN } = {}) {
  if (!username || username.length < min) return `Handle must be at least ${min} characters`;
  if (username.length > USERNAME_MAX) return `Handle must be at most ${USERNAME_MAX} characters`;
  if (!/^[a-z0-9_]+$/.test(username)) return 'Use only a–z, 0–9 and _';
  if (RESERVED_USERNAMES.includes(username)) return 'This handle is reserved';
  return '';
}

/** Запасной хэндл для случаев, когда выбранный недоступен. */
export function fallbackUsername(userId, length = 6) {
  return `user_${String(userId).replace(/-/g, '').slice(0, length)}`;
}
