import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { generatePages } from './generate-pages.mjs';

const sources = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css']);
const ignored = new Set(['.git', 'node_modules', 'dist', '.vite', 'coverage']);
const geometry = /new\s+(?:THREE\.)?(?:Mesh|Points|Line|LineLoop|SphereGeometry|PlaneGeometry|BoxGeometry|TorusGeometry|IcosahedronGeometry|ExtrudeGeometry|BufferGeometry)\s*\(/;
function walk(base, folder, apply) {
  if (!existsSync(folder)) return;
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    if (ignored.has(item.name)) continue;
    const path = join(folder, item.name);
    if (item.isDirectory()) walk(base, path, apply);
    else if (item.isFile()) apply(relative(base, path).replaceAll('\\', '/'), readFileSync(path, 'utf8'));
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
    for (const field of ['base', 'highlight', 'surface', 'text']) {
      if (!/^#[a-f0-9]{6}$/i.test(config.palette?.[field] || '')) issues.push('Invalid palette.' + field);
    }
  }
  const colors = new Set(Object.values(config?.palette || {}).map(x => String(x).toLowerCase()));
  const required = [
    'meditation', 'src/App.tsx', 'src/main.tsx', 'src/generated/perspectives.json',
    'src/libraries/components', 'src/libraries/components/Carousel3D',
    'src/libraries/utils', 'src/perspectives', 'src/perspectives/content.ts',
  ];
  for (const path of required) if (!existsSync(join(root, path))) issues.push('Missing ' + path);
  for (const path of ['exposition', 'src/scene', 'src/components', 'src/exposition.ts']) {
    if (existsSync(join(root, path))) issues.push('Legacy architecture prohibited: ' + path);
  }
  if (existsSync(join(root, 'src'))) {
    for (const item of readdirSync(join(root, 'src'), { withFileTypes: true })) {
      if (item.isFile() && /\.(?:ts|tsx|css)$/.test(item.name) &&
          !['App.tsx', 'main.tsx'].includes(item.name))
        issues.push('src root only permits App.tsx and main.tsx: ' + item.name);
    }
  }
  walk(root, root, (path, content) => {
    if (!sources.has(extname(path))) return;
    const lines = content.split(/\r?\n/).length;
    if (lines > 200) issues.push(path + ': ' + lines + ' lines (limit 200)');
    if (path.startsWith('src/')) {
      for (const match of content.matchAll(/#[a-f0-9]{3,8}\b/gi)) {
        if (!colors.has(match[0].toLowerCase())) issues.push(path + ': off-palette ' + match[0]);
      }
    }
    if (path.startsWith('src/perspectives/') && geometry.test(content))
      issues.push(path + ': reusable 3D objects belong in src/libraries/components/3d');
    if (path.startsWith('src/libraries/components/Carousel3D/') &&
        /(?:from\s*['"][^'"]*perspectives\/|meditation\/|generated\/perspectives|\bSTATIONS\b)/.test(content))
      issues.push(path + ': Carousel3D must not import Meditation-specific content');
  });
  try { generatePages(root, true); } catch (error) { issues.push(String(error.message ?? error)); }
  if (issues.length) throw new Error('Skiplet constraints failed:\n- ' + issues.join('\n- '));
  console.log('Skiplet constraints passed: meditation → perspectives → views, reusable libraries, palette and 200-line limit');
}
