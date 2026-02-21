#!/usr/bin/env bash
set -euo pipefail

backup_dir="${HOMEWORK_DB_BACKUP_DIR:-backups}"
timestamp="$(date +"%Y%m%d-%H%M%S")"

resolve_db_path() {
  local database_url="${DATABASE_URL:-}"

  if [[ -z "$database_url" && -f ".env" ]]; then
    database_url="$(grep -E '^DATABASE_URL=' .env | tail -n1 | cut -d= -f2- || true)"
    database_url="${database_url%\"}"
    database_url="${database_url#\"}"
    database_url="${database_url%\'}"
    database_url="${database_url#\'}"
  fi

  if [[ "$database_url" == file:* ]]; then
    local sqlite_path="${database_url#file:}"
    if [[ "$sqlite_path" == /* ]]; then
      echo "$sqlite_path"
      return
    fi

    sqlite_path="${sqlite_path#./}"
    echo "prisma/$sqlite_path"
    return
  fi

  echo "prisma/homework.db"
}

db_path="$(resolve_db_path)"

if [[ ! -f "$db_path" ]]; then
  echo "Database file not found: $db_path"
  echo "Tip: run 'bun run db:setup' first."
  exit 1
fi

mkdir -p "$backup_dir"
backup_file="$backup_dir/homework-$timestamp.db"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$db_path" ".backup '$backup_file'"
else
  cp "$db_path" "$backup_file"
fi

echo "Backup created: $backup_file"
