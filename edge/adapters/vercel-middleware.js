// Vercel: скопируй этот файл в корень проекта как  middleware.js
// Переменные окружения проекта: SUPABASE_URL, SUPABASE_ANON_KEY
// (те же значения, что VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
//
// НЕ ПРОВЕРЕНО на живой Vercel — проверь командой из edge/README.md.
import { BOT_UA, profileMetaResponse } from './edge/og.js';

export const config = { matcher: '/:username' };

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (BOT_UA.test(ua)) {
    const url = new URL(request.url);
    const res = await profileMetaResponse({
      pathname: url.pathname,
      origin: url.origin,
      env: { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY }
    });
    if (res) return res;
  }
  // Продолжить обычную обработку (так же делает next() из @vercel/functions).
  return new Response(null, { headers: { 'x-middleware-next': '1' } });
}
