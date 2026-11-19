import { readFileSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';
const config = JSON.parse(readFileSync('meditations.config.json', 'utf8'));
const palette = config.palette;
const hex = /^#[0-9a-f]{6}$/i;
const keys = ['base', 'highlight', 'surface', 'text'];
for (const key of keys) {
  if (typeof palette?.[key] !== 'string' || !hex.test(palette[key])) {
    throw new Error(`Invalid palette.${key}: expected six-digit hex color`);
  }
}
const allowed = new Set(Object.values(palette).map(value => value.toLowerCase()));
const extensions = new Set(['.css', '.tsx', '.ts', '.jsx']);
const ignored = new Set(['.git', 'node_modules', 'dist']);
function visit(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const file = join(dir, entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (!extensions.has(extname(file))) continue;
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(/#[0-9a-f]{3,8}\b/gi)) {
      if (!allowed.has(match[0].toLowerCase())) {
        throw new Error(`Unconfigured color ${match[0]} in ${file}`);
      }
    }
  }
}
visit('src');
console.log('Palette configuration and source color literals verified');
