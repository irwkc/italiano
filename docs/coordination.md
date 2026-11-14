# Coordination

## Запросы к бэкенду

1. **Согласие на ПД при регистрации по инвайту** — ✅ серверная проверка: веб `registerInviteAction` и mobile `POST /auth/register` требуют `consent=yes` / `consent: true`.
2. **Прод-env кабинета** — проверено через `GET /api/health` после деплоя (без значений секретов):
   - `database` ✅ `store` ✅ `aulaPassword` ✅
   - `sessionSecret` ❌ `appUrl` ❌ `smtp` ❌ — **владельцу** дописать в `/opt/italiano/.env` и `docker compose up -d` (см. `.env.example` / `docs/aula-ops.md`). Без них инвайты, письма подтверждения, абсолютные URL картинок и надёжные mobile-токены неполноценны.
3. **Mobile API для iOS** — ✅ задеплоено (`/api/mobile/v1/health` → ok). Push send — позже, нужны APNs-ключи.
