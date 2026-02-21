import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const repoRoot = process.cwd()
const backupScriptPath = path.join(repoRoot, 'scripts/db-backup.sh')
const restoreScriptPath = path.join(repoRoot, 'scripts/db-restore.sh')

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

function hasSqlite3(): boolean {
  try {
    execFileSync('sqlite3', ['-version'], { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function runScript(scriptPath: string, cwd: string, args: string[] = []): void {
  execFileSync('bash', [scriptPath, ...args], {
    cwd,
    env: { ...process.env },
    stdio: 'pipe',
  })
}

function createTempWorkspace(): { cwd: string; dbPath: string } {
  const cwd = mkdtempSync(path.join(tmpdir(), 'homework-db-scripts-'))
  tempDirs.push(cwd)
  mkdirSync(path.join(cwd, 'prisma'), { recursive: true })
  writeFileSync(path.join(cwd, '.env'), 'DATABASE_URL=file:./homework.db\n')
  return { cwd, dbPath: path.join(cwd, 'prisma/homework.db') }
}

function setDbMarker(dbPath: string, marker: string): void {
  if (hasSqlite3()) {
    const sqlMarker = marker.replace(/'/g, "''")
    execFileSync(
      'sqlite3',
      [
        dbPath,
        `CREATE TABLE IF NOT EXISTS markers (value TEXT); DELETE FROM markers; INSERT INTO markers(value) VALUES ('${sqlMarker}');`,
      ],
      { stdio: 'pipe' },
    )
    return
  }

  writeFileSync(dbPath, `marker=${marker}`)
}

function readDbMarker(dbPath: string): string {
  if (hasSqlite3()) {
    return execFileSync('sqlite3', [dbPath, 'SELECT value FROM markers LIMIT 1;'], {
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim()
  }

  const raw = readFileSync(dbPath, 'utf8')
  return raw.replace(/^marker=/, '').trim()
}

function listBackups(cwd: string): string[] {
  const backupDir = path.join(cwd, 'backups')
  if (!existsSync(backupDir)) return []
  return readdirSync(backupDir)
}

describe('SQLite backup scripts', () => {
  it('creates a timestamped backup in backups/', () => {
    const { cwd, dbPath } = createTempWorkspace()
    setDbMarker(dbPath, 'alpha')

    runScript(backupScriptPath, cwd)

    const backups = listBackups(cwd).filter((name) => /^homework-\d{8}-\d{6}\.db$/.test(name))
    expect(backups).toHaveLength(1)

    const backupFile = path.join(cwd, 'backups', backups[0] as string)
    expect(statSync(backupFile).size).toBeGreaterThan(0)
  })

  it('restores the latest backup and creates a pre-restore snapshot', () => {
    const { cwd, dbPath } = createTempWorkspace()
    setDbMarker(dbPath, 'original')

    runScript(backupScriptPath, cwd)
    setDbMarker(dbPath, 'mutated')

    runScript(restoreScriptPath, cwd)

    expect(readDbMarker(dbPath)).toBe('original')

    const backups = listBackups(cwd)
    const safetySnapshots = backups.filter((name) => /^pre-restore-\d{8}-\d{6}\.db$/.test(name))
    expect(safetySnapshots.length).toBeGreaterThan(0)
  })
})
