#!/usr/bin/env bash
# Backup Postgres from docker compose on the VPS.
# Usage (on host with compose): ./scripts/backup-db.sh [output-dir]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-$ROOT/backups}"
mkdir -p "$OUT_DIR"

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "$ROOT/.env"
  set +a
fi

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"

STAMP="$(date +%F-%H%M%S)"
FILE="$OUT_DIR/aula-${STAMP}.sql.gz"

cd "$ROOT"
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip >"$FILE"
echo "Wrote $FILE"
# Keep last 14 dumps in OUT_DIR
ls -1t "$OUT_DIR"/aula-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
