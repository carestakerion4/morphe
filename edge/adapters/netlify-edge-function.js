/* global Deno */
// Netlify: скопируй как  netlify/edge-functions/og.js  и добавь в netlify.toml:
//   [[edge_functions]]
//   path = "/*"
//   function = "og"
// Переменные окружения сайта: SUPABASE_URL, SUPABASE_ANON_KEY
//
// НЕ ПРОВЕРЕНО на живом Netlify — проверь командой из edge/README.md.
import { BOT_UA, profileMetaResponse } from '../../edge/og.js';

export default async (request, context) => {
  const ua = request.headers.get('user-agent') || '';
  if (BOT_UA.test(ua)) {
    const url = new URL(request.url);
    const res = await profileMetaResponse({
      pathname: url.pathname,
      origin: url.origin,
      env: { SUPABASE_URL: Deno.env.get('SUPABASE_URL'), SUPABASE_ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY') }
    });
    if (res) return res;
  }
  return context.next();
};
