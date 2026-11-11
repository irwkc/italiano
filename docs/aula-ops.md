# Aula ops

## Env (VPS `/opt/italiano/.env`, never commit)

```
AULA_PASSWORD=...
SESSION_SECRET=...   # long random; signs teacher/student cookies
APP_URL=https://giacomoschiavon.ru
DATABASE_URL=postgres://...
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=giacomo_noreply@mail.ru
SMTP_PASS=...
SMTP_FROM=giacomo_noreply@mail.ru
```

`DATABASE_URL` is required for compose: the app persists aula store in Postgres (`aula_store` jsonb). File fallback under `learn/data/` is atomic (temp + rename) for local/dev only.

## Backup

```bash
# from host with docker compose
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > aula-$(date +%F).sql
```

Restore with `psql` into the same database. Keep dumps off the app volume.

## Student auth

Teacher → Studenti → **Пригласить** → one-time link `/aula/invite/...` → student sets name/email/password → confirm email → login at `/aula/login`.
