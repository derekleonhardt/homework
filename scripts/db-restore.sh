#!/usr/bin/env bash
set -euo pipefail

backup_dir="${HOMEWORK_DB_BACKUP_DIR:-backups}"

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

pick_backup_file() {
  if [[ $# -gt 0 && -n "${1:-}" ]]; then
    echo "$1"
    return
  fi

  local latest_backup
  latest_backup="$(ls -1t "$backup_dir"/homework-*.db 2>/dev/null | head -n1 || true)"
  if [[ -z "$latest_backup" ]]; then
    echo ""
    return
  fi
  echo "$latest_backup"
}

backup_file="$(pick_backup_file "${1:-}")"
if [[ -z "$backup_file" ]]; then
  echo "No backup file found."
  echo "Usage: bun run db:restore -- <backup-file>"
  echo "Or create one first with: bun run db:backup"
  exit 1
fi

if [[ ! -f "$backup_file" ]]; then
  echo "Backup file not found: $backup_file"
  exit 1
fi

db_path="$(resolve_db_path)"
mkdir -p "$(dirname "$db_path")"
mkdir -p "$backup_dir"

if [[ -f "$db_path" ]]; then
  safety_backup="$backup_dir/pre-restore-$(date +"%Y%m%d-%H%M%S").db"
  if command -v sqlite3 >/dev/null 2>&1; then
    sqlite3 "$db_path" ".backup '$safety_backup'"
  else
    cp "$db_path" "$safety_backup"
  fi
  echo "Current DB snapshot saved: $safety_backup"
fi

rm -f "${db_path}-wal" "${db_path}-shm"
cp "$backup_file" "$db_path"

echo "Database restored from: $backup_file"
echo "Restored to: $db_path"
