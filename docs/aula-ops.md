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

Schema changes are additive in `hydrate()` (`mobileSessions`, `deviceTokens`, activity `level` / `chapter`, …) — no destructive migrations. `hydrate()` validates activity placement in memory and does not write the document, so tasks that omit `level` or `chapter` are left untouched.

### Activity level and chapter

Catalog tasks are objects in `aula_store.data` → `activities[]` (jsonb). There is no separate activities table. Optional fields (omit the property entirely when unused — do not store `null`):

| Field | Allowed values |
| --- | --- |
| `level` | `"A1"` \| `"A2"` \| `"B1"` \| `"B2"` \| `"C1"` \| `"C2"` |
| `chapter.number` | integer `1`–`999`, unique within a level |
| `chapter.title` | non-empty string, trimmed, at most 160 characters |
| `topic` | required section label (unchanged) |

`chapter` is an object `{ "number", "title" }`. Both of its fields are required together. Tasks in one level that share `chapter.number` are one chapter; use a single title. Within a level, Schede groups by chapter, then by `topic`. For a flat chapter, set `topic` to `chapter.title`.

Teacher tab query: `?level=A1|A2|B1|B2|C1|C2|none` and `?chapter=<number>|none`. See `learn/cefr.ts`.

### A1 catalog import

The production image ships `node /app/a1-import/import-a1.mjs` and `activities.json`. It does not include `tsx`. The script updates only activity ids `a1-c01-01` … `a1-c10-20` inside `aula_store` row `id = 1`. Before an UPDATE it writes the current row to a JSON file and prints that path. A repeat run that already matches the catalog does not write.

From `/opt/italiano`, after this image is the running `app` service:

```bash
sudo docker compose exec app node /app/a1-import/import-a1.mjs
sudo docker compose exec -e A1_IMPORT_CONFIRM=production app node /app/a1-import/import-a1.mjs --apply
```

`A1_IMPORT_CONFIRM=local` is refused when the database host looks like production. The apply command prints `backup`. That file is the row before the write, under `/app/learn/data/backups` when that directory is writable, otherwise `/tmp/a1-import-backups`. Copy it out with `sudo docker compose cp` if you want it on the host.

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
