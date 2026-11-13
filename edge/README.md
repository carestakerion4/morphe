# Превью ссылок для ботов

Сайт — SPA: профиль подгружается в браузере. Боты (Telegram, Discord, VK, Slack, соцсети,
поисковики) JavaScript не исполняют, поэтому ссылка на профиль выглядит как общий «MORPHE»
без имени и аватара. `edge/og.js` отдаёт ботам маленькую HTML-страницу с OG-тегами профиля.
Люди продолжают получать обычное SPA.

Ядро (`og.js`) покрыто тестами (`npm test`). Адаптеры под хостинги — тонкие обёртки (~15 строк),
**на живых платформах я их не запускал**. Выбери свой хостинг:

| Хостинг | Что скопировать | Где задать переменные |
|---|---|---|
| Vercel | `edge/adapters/vercel-middleware.js` → `middleware.js` в корне | Project → Settings → Environment Variables |
| Cloudflare Pages | `edge/adapters/cloudflare-pages-function.js` → `functions/[username].js` | Settings → Variables and Secrets |
| Netlify | `edge/adapters/netlify-edge-function.js` → `netlify/edge-functions/og.js` + блок из комментария в `netlify.toml` | Site settings → Environment variables |

Переменные: `SUPABASE_URL` и `SUPABASE_ANON_KEY` (те же значения, что у `VITE_…`, но без префикса:
`VITE_` вшивается только в клиентский бандл, на сервере переменные читаются по обычным именам).
Ключ — публичный (anon/publishable), `service_role` сюда класть нельзя.

## Проверка после деплоя

```bash
# бот должен получить og:title профиля:
curl -s -A "TelegramBot (like TwitterBot)" https://ТВОЙ-ДОМЕН/ТВОЙ_НИК | grep -i og:title
# человек — обычное SPA (в ответе есть <div id="root">):
curl -s -A "Mozilla/5.0" https://ТВОЙ-ДОМЕН/ТВОЙ_НИК | grep -c 'id="root"'
```

Telegram и VK кэшируют превью: после первой проверки обнови его через `@WebpageBot` (Telegram)
или отладчик VK. Если превью не меняется — это кэш мессенджера, а не ошибка.

## Что нельзя ломать
`BOT_UA` намеренно НЕ включает слова `Telegram`/`Viber`/`Instagram` целиком: встроенные браузеры
этих приложений содержат их в User-Agent, и живые люди получили бы заглушку вместо сайта.
