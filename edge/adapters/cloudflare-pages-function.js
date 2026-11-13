// Cloudflare Pages: скопируй как  functions/[username].js
// Переменные окружения проекта (Settings → Variables): SUPABASE_URL, SUPABASE_ANON_KEY
//
// НЕ ПРОВЕРЕНО на живом Cloudflare — проверь командой из edge/README.md.
import { BOT_UA, profileMetaResponse } from '../edge/og.js';

export async function onRequest(context) {
  const { request, env, next } = context;
  const ua = request.headers.get('user-agent') || '';
  if (BOT_UA.test(ua)) {
    const url = new URL(request.url);
    const res = await profileMetaResponse({ pathname: url.pathname, origin: url.origin, env });
    if (res) return res;
  }
  return next();
}
