# MORPHE

Личный сайт со ссылками и профилями. Интерфейс — React/Vite, аккаунты и данные профилей — Supabase.

## Запуск локально

1. Установи Node.js LTS.
2. Установи зависимости:

   ```sh
   npm install
   ```

3. Создай `.env.local` в корне проекта и добавь публичные ключи своего Supabase-проекта:

   ```dotenv
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-OR-ANON-KEY
   ```

   Для локальной разработки также можно использовать уже существующий `.env`. Не публикуй его.
   `service_role` / secret key нельзя помещать в переменные `VITE_` или клиентский код.

4. Запусти сайт:

   ```sh
   npm run dev
   ```

   Vite покажет адрес, обычно `http://localhost:5173`.

Перед запуском проверь, что в Supabase настроены таблица `profiles`, авторизация и Storage bucket
`media`. Файл `supabase/001_eidos_hardening.sql` — миграция безопасности существующей базы, а не
начальная схема: сначала прочитай `supabase/000_preflight.sql` и комментарии в миграции.

## Деплой на Vercel

1. Добавь проект в GitHub и импортируй репозиторий в Vercel.
2. Для Vite оставь стандартные настройки:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
3. В Vercel → **Settings → Environment Variables** добавь
   `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` для Production (и Preview, если нужно).
4. В Supabase → **Authentication → URL Configuration** укажи домен сайта как Site URL и добавь
   адреса деплоя в Redirect URLs. После изменения переменных пересобери и задеплой приложение.
5. При желании подключи свой домен в Vercel → **Settings → Domains**.

`vercel.json` уже настраивает маршрутизацию SPA, поэтому профили вида `https://домен/ник` открываются
напрямую. Для соц-превью профилей есть отдельная необязательная настройка в [edge/README.md](./edge/README.md).

## Проверки

```sh
npm test
npm run lint
npm run build
```
