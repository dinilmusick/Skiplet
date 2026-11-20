#!/usr/bin/env node
import { generatePages } from './generate-pages.mjs';
import { checkConstraints } from './check-constraints.mjs';
import { spawnSync } from 'node:child_process';

const [command, subcommand, ...flags] = process.argv.slice(2);
const help = [
  'Skiplet Meditation CLI',
  '  skiplet generate perspectives [--check]   Generate manifest, perspective and view entrypoints',
  '  skiplet generate pages [--check]         Legacy alias',
  '  skiplet check constraints                Enforce Meditation / libraries / perspectives / views',
  '  skiplet check all                        Constraints, tests, TypeScript and production build',
].join('\n');
try {
  if (command === 'generate' && [undefined, 'perspectives', 'pages'].includes(subcommand)
      && flags.every(flag => flag === '--check')) {
    const check = flags.includes('--check');
    const items = generatePages(process.cwd(), check);
    console.log((check ? 'Verified ' : 'Generated ') + items.length +
      ' perspective(s) and ' + items.reduce((n, item) => n + item.views.length, 0) +
      ' view(s) with corresponding React files');
  } else if (command === 'check' && subcommand === 'constraints' && flags.length === 0) {
    checkConstraints(process.cwd());
  } else if (command === 'check' && subcommand === 'all' && flags.length === 0) {
    checkConstraints(process.cwd());
    for (const task of ['test', 'typecheck', 'build']) {
      const result = spawnSync('npm', ['run', task], { stdio: 'inherit' });
      if (result.status !== 0) throw new Error(task + ' failed');
    }
  } else {
    console.error(help);
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
