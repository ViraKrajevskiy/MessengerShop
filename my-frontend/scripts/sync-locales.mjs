// Copies the canonical translation JSON (src/i18n/locales/*.json) into public/locales/
// so Vite emits them to dist/locales/*.json with stable, un-hashed names.
// These are the files the site owner edits directly on the server at runtime.
import { readdirSync, mkdirSync, copyFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'src', 'i18n', 'locales')
const outDir = join(root, 'public', 'locales')

mkdirSync(outDir, { recursive: true })
for (const f of readdirSync(srcDir).filter((n) => n.endsWith('.json'))) {
  copyFileSync(join(srcDir, f), join(outDir, f))
  console.log('synced locale ->', join('public', 'locales', f))
}
