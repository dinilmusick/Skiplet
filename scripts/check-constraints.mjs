import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { generatePages } from './generate-pages.mjs';

const allowedSources = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css']);
const ignored = new Set(['.git', 'node_modules', 'dist', '.vite', 'coverage']);
function walk(base, folder, apply) {
  if (!existsSync(folder)) return;
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    if (ignored.has(item.name)) continue;
    const path = join(folder, item.name);
    if (item.isDirectory()) walk(base, path, apply);
    else if (item.isFile()) apply(relative(base, path), readFileSync(path, 'utf8'));
  }
}
export function checkConstraints(root = process.cwd()) {
  const issues = [];
  let config;
  try { config = JSON.parse(readFileSync(join(root, 'meditations.config.json'), 'utf8')); }
  catch { issues.push('Missing or invalid meditations.config.json'); }
  if (config) {
    for (const field of ['id', 'title', 'concept', 'artStyle', 'colorScheme']) {
      if (!String(config[field] ?? '').trim()) issues.push('Missing config.' + field);
    }
    if (!String(config.id).startsWith('MDT-')) issues.push('Config id must start MDT-');
    for (const field of ['truthTags', 'emotionTags', 'artTags', 'materials', 'textures']) {
      if (!Array.isArray(config[field]) || !config[field].length) issues.push('Invalid config.' + field);
    }
    const palette = config.palette || {};
    for (const field of ['base', 'highlight', 'surface', 'text']) {
      if (!/^#[a-f0-9]{6}$/i.test(palette[field] || '')) issues.push('Invalid palette.' + field);
    }
  }
  const colors = new Set(Object.values(config?.palette || {}).map(x => String(x).toLowerCase()));
  const required = ['src/components', 'src/scene', 'src/exposition.ts', 'src/generated/perspectives.json'];
  for (const path of required) if (!existsSync(join(root, path))) issues.push('Missing ' + path);
  walk(root, root, (path, content) => {
    if (!allowedSources.has(extname(path))) return;
    const lines = content.split(/\r?\n/).length;
    if (lines > 200) issues.push(path + ': ' + lines + ' lines (limit 200)');
    if (path.startsWith('src/')) {
      for (const color of content.matchAll(/#[a-f0-9]{3,8}\b/gi)) {
        if (!colors.has(color[0].toLowerCase())) issues.push(path + ': off-palette ' + color[0]);
      }
    }
    if (path.startsWith('src/scene/') &&
        /new\s+(?:THREE\.)?(?:Mesh|Points|Line|LineLoop|SphereGeometry|PlaneGeometry|BoxGeometry|TorusGeometry|IcosahedronGeometry|ExtrudeGeometry|BufferGeometry)\s*\(/.test(content)) {
      issues.push(path + ': reusable 3D objects belong in src/components/3d');
    }
  });
  try { generatePages(root, true); } catch (error) { issues.push(String(error.message ?? error)); }
  if (issues.length) throw new Error('Skiplet constraints failed:\n- ' + issues.join('\n- '));
  console.log('Skiplet constraints passed: config, palette, 200-line limit, scene/components, exposition registry');
}
