# Coordination

## Запросы к бэкенду

1. **Согласие на ПД при регистрации по инвайту** — в форме `/aula/invite/[token]` добавлен checkbox `consent=yes` (required в UI). Нужна серверная проверка в `registerInviteAction`: без согласия не создавать аккаунт.
2. **Прод-env кабинета** — `SESSION_SECRET`, `SMTP_*`, `APP_URL` на сервере настраивает **бэкенд-агент** (см. `docs/aula-ops.md`). Фронт их не трогает.
