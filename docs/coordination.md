# Coordination

## Запросы к бэкенду

1. **Согласие на ПД при регистрации по инвайту** — ✅ серверная проверка: веб `registerInviteAction` и mobile `POST /auth/register` требуют `consent=yes` / `consent: true`.
2. **Прод-env кабинета** — `SESSION_SECRET`, `SMTP_*`, `APP_URL` на сервере (`/opt/italiano/.env`). Бэкенд-агент без SSH deploy-ключа не может править файл на VPS; проверка через `GET /api/health` (флаги без значений). Недостающие значения — владельцу (см. отчёт / `.env.example`).
3. **Mobile API для iOS** — ✅ эндпоинты по `docs/mobile-api.md` (включая `/gloss`, `/live/next`, absolute image URLs, `/devices`). Push send — позже, нужны APNs-ключи.
