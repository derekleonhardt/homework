# Homework

Homework is a local-first personal capture app.

Save URLs, books, and notes, then enrich metadata and auto-tag them. It also includes a browser extension for one-click ingest.

## Disclaimer

This project is intended for local/private use and is not meant to be exposed to the public internet.

## Quickstart (Local)

Prerequisite: Bun 1.3+

```bash
bun install
cp .env.example .env
bun run generate
bun run db:setup
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quickstart (Docker)

```bash
cp .env.example .env
bun run docker:up
```

Open [http://localhost:3000](http://localhost:3000).

Useful Docker commands:

```bash
bun run docker:ps
bun run docker:logs
bun run docker:restart
bun run docker:down
```

Docker and local Bun share the same SQLite file: `prisma/homework.db`.

FYI: do not run both local (`bun run dev`) and Docker (`bun run docker:up`) at the same time against the same SQLite file.

## Repository Structure

```text
app/                  Next.js App Router pages and API routes
components/           UI components
hooks/                React hooks
lib/                  Core app logic (parsing, metadata, utils, validation, db helpers)
prisma/               Prisma schema, migrations, and local SQLite DB file
scripts/              Utility scripts (DB backup/restore)
extension/            Browser extension source/build scripts
Dockerfile            Container image definition
docker-compose.yml    Local container orchestration
package.json          Project scripts and dependencies
```

## Environment

Required:

- `DATABASE_URL=file:./homework.db`

Optional:

- `GOOGLE_API_KEY` for YouTube + Google Books enrichment
- `X_API_TOKEN` for X enrichment
- `ANTHROPIC_API_KEY` for AI tagging

## Browser Extension

Build:

```bash
cd extension
./build.sh chrome
```

For Firefox:

```bash
cd extension
./build.sh firefox
```

Load extension:

- Chrome: `chrome://extensions` -> enable Developer mode -> Load unpacked -> select `extension/`
- Firefox: `about:debugging#/runtime/this-firefox` -> Load Temporary Add-on -> select `extension/manifest.json`

## SQLite Backup and Restore

```bash
bun run db:backup
bun run db:backup:list
bun run db:restore -- backups/homework-YYYYMMDD-HHMMSS.db
bun run db:restore
```

- Backups are written to `backups/`.
- `bun run db:restore` with no file restores the most recent backup.
- Restore creates a pre-restore safety snapshot in `backups/`.

## License

MIT
