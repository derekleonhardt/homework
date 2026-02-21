import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const extDir = path.resolve(__dirname)

describe('firefox manifest', () => {
  it('includes config.js in background scripts', () => {
    const manifest = JSON.parse(readFileSync(path.join(extDir, 'manifest.firefox.json'), 'utf-8'))
    expect(manifest.background.scripts).toContain('config.js')
  })
})

describe('background.js', () => {
  it('does not unconditionally call importScripts', () => {
    const source = readFileSync(path.join(extDir, 'background.js'), 'utf-8')
    // Should not start with bare importScripts call
    const hasUnguardedImport = /^importScripts\s*\(/m.test(source)
    expect(hasUnguardedImport).toBe(false)
  })
})
