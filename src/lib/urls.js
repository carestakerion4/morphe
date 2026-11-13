// Работа с пользовательскими URL.

const HTTP_RE = /^https?:\/\//i;

/**
 * Приводит ввод пользователя к абсолютному http(s)-URL.
 * Возвращает строку или null, если ввод нельзя превратить в нормальную ссылку.
 * Примеры: "t.me/neo" -> "https://t.me/neo"; "javascript:alert(1)" -> null.
 */
export function normalizeLinkUrl(input, { maxLength = 2048 } = {}) {
  const raw = String(input ?? '').trim();
  if (!raw || raw.length > maxLength) return null;
  // Любая схема, кроме http(s), отбрасывается (javascript:, data:, mailto: …).
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !HTTP_RE.test(raw)) {
    // "example.com:8080/path" тоже похоже на схему — допускаем, если после ':' идёт порт.
    if (!/^[^\s:/]+\.[^\s:/]+:\d+(\/|$)/.test(raw)) return null;
  }
  const withScheme = HTTP_RE.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname || !u.hostname.includes('.')) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Для рендера: возвращает URL только если это http(s), иначе undefined. */
export function toSafeHttpUrl(url) {
  if (typeof url !== 'string') return undefined;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Для <img src>: только http(s)-ссылки. */
export const toSafeImageUrl = toSafeHttpUrl;
