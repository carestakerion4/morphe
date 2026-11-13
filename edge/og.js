// Превью профилей для ботов (Telegram, Discord, VK, Slack, соцсети, поисковики).
//
// Зачем: сайт — SPA, профиль подгружается в браузере. Боты JavaScript не исполняют,
// поэтому без этого файла любая ссылка на профиль выглядит как общий «MORPHE».
// Ядро ничего не знает о платформе хостинга: см. edge/adapters/*.
//
// Работает на стандартных Request/Response/fetch (Node 18+, Cloudflare, Vercel Edge, Deno).

/**
 * ВАЖНО: только ботов-«превьюшников». Встроенные браузеры мессенджеров (Telegram-Android,
 * Instagram, VK-приложение) — это живые люди, им нужно SPA, а не заглушка.
 */
export const BOT_UA =
  /(TelegramBot|Discordbot|Slackbot|Twitterbot|facebookexternalhit|Facebot|vkShare|WhatsApp\/|LinkedInBot|SkypeUriPreview|Pinterestbot|redditbot|Applebot|Googlebot|bingbot|YandexBot|Mail\.RU_Bot|Mastodon|Embedly|crawler|spider)/i;

const USERNAME_RE = /^[a-z0-9_]{2,64}$/;

// Зеркалит src/lib/username.js
const RESERVED = new Set([
  'admin', 'explore', 'login', 'logout', 'register', 'signup', 'signin', 'settings', 'api', 'auth',
  'eidos', 'support', 'help', 'about', 'privacy', 'terms', 'dashboard', 'assets', 'static', 'public',
  'favicon', 'robots', 'sitemap', 'me', 'null', 'undefined'
]);

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(text, max) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** og:image должен быть абсолютным https-URL. */
function safeHttpsImage(url) {
  try {
    const u = new URL(String(url ?? ''));
    return u.protocol === 'https:' ? u.toString() : '';
  } catch {
    return '';
  }
}

export function renderProfileHtml(profile, origin) {
  const username = profile.username;
  const name = truncate(profile.display_name || username, 60);
  const title = `${name} (@${username}) — MORPHE`;
  const description = truncate(profile.bio, 200) || `@${username} on MORPHE`;
  const url = `${origin}/${username}`;
  const image = safeHttpsImage(profile.avatar_url);

  const meta = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:site_name" content="MORPHE">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    image ? `<meta property="og:image" content="${escapeHtml(image)}">` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ''
  ]
    .filter(Boolean)
    .join('\n    ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    ${meta}
  </head>
  <body>
    <h1>${escapeHtml(name)}</h1>
    <p>${escapeHtml(description)}</p>
    <a href="${escapeHtml(url)}">${escapeHtml(url)}</a>
  </body>
</html>
`;
}

/**
 * Возвращает Response с OG-страницей или null (тогда адаптер отдаёт обычное SPA).
 * env: { SUPABASE_URL, SUPABASE_ANON_KEY }
 */
export async function profileMetaResponse({ pathname, origin, env, fetchImpl = fetch }) {
  const m = /^\/([^/]+)\/?$/.exec(pathname || '');
  if (!m) return null;

  let username;
  try {
    username = decodeURIComponent(m[1]).toLowerCase();
  } catch {
    return null;
  }
  if (!USERNAME_RE.test(username) || RESERVED.has(username)) return null;
  if (!env?.SUPABASE_URL || !env?.SUPABASE_ANON_KEY) return null;

  const endpoint =
    `${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/profiles` +
    `?select=username,display_name,bio,avatar_url,is_banned` +
    `&username=eq.${encodeURIComponent(username)}&limit=1`;

  let rows;
  try {
    const res = await fetchImpl(endpoint, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` }
    });
    if (!res.ok) return null;
    rows = await res.json();
  } catch {
    return null; // любой сбой → обычное SPA, а не 500 для бота
  }

  const profile = Array.isArray(rows) ? rows[0] : null;
  if (!profile || profile.is_banned) return null;

  return new Response(renderProfileHtml(profile, origin), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300'
    }
  });
}
