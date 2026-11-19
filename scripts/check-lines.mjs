import { readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
const extensions = new Set(['.ts','.tsx','.js','.jsx','.mjs','.css']);
const ignored = new Set(['.git','node_modules','dist']);
let failed = false;
function visit(dir) {
  for (const entry of readdirSync(dir,{withFileTypes:true})) {
    if (ignored.has(entry.name)) continue;
    const path=join(dir,entry.name);
    if (entry.isDirectory()) visit(path);
    else if (extensions.has(extname(path))) {
      const lines=readFileSync(path,'utf8').split('\n').length;
      if (lines>200) {console.error(`${path}: ${lines} lines`);failed=true;}
    }
  }
}
visit('.');
if (failed) process.exitCode=1;
else console.log('Source line limit passed');
