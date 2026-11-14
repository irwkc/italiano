# Aula ops

## Env (VPS `/opt/italiano/.env`, never commit)

See also `.env.example`. Required for invites / mobile API:

```
AULA_PASSWORD=...
SESSION_SECRET=...   # long random; signs web cookies + mobile access tokens
APP_URL=https://giacomoschiavon.ru
DATABASE_URL=postgres://...
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=...
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=giacomo_noreply@mail.ru
SMTP_PASS=...
SMTP_FROM=giacomo_noreply@mail.ru
```

`DATABASE_URL` is required for compose: the app persists aula store in Postgres (`aula_store` jsonb). File fallback under `learn/data/` is atomic (temp + rename) for local/dev only.

Schema changes are additive in `hydrate()` (`mobileSessions`, `deviceTokens`, …) — no destructive migrations.

## Health

- `GET /api/health` — DB/store + **boolean** flags (`sessionSecret`, `smtp`, `appUrl`, …); never returns secret values.
- `GET /api/mobile/v1/health` — mobile API liveness.

## Backup

```bash
# on the VPS from /opt/italiano
./scripts/backup-db.sh /var/backups/italiano
# or:
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > aula-$(date +%F).sql.gz
```

Restore with `gunzip -c … | psql` into the same database. Keep dumps off the app volume.

## Student auth

Teacher → Studenti → **Пригласить** → one-time link `/aula/invite/...` → student sets name/email/password + consent → confirm email → login at `/aula/login` or mobile `/api/mobile/v1/auth/login`.

Mobile contract: `docs/mobile-api.md`.
