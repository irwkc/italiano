# Coordination

## Запросы к бэкенду

1. **Согласие на ПД при регистрации по инвайту** — в форме `/aula/invite/[token]` добавлен checkbox `consent=yes` (required в UI). Нужна серверная проверка в `registerInviteAction`: без согласия не создавать аккаунт.
2. **SMTP / SESSION_SECRET / APP_URL** на проде — без них инвайты и подтверждение почты не работают (см. `docs/aula-ops.md`).
