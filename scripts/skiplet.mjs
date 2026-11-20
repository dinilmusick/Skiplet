#!/usr/bin/env node
import { generatePages } from './generate-pages.mjs';
import { checkConstraints } from './check-constraints.mjs';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const [command, target, ...flags] = args;
const help = 'Usage: skiplet generate perspectives [--check] | skiplet check constraints | skiplet check all';
try {
  if ((command === 'generate' || command === 'generate:') &&
      ['perspectives', 'pages'].includes(target) &&
      flags.every(flag => flag === '--check')) {
    const items = generatePages(process.cwd(), flags.includes('--check'));
    console.log((flags.includes('--check') ? 'Verified ' : 'Generated ') +
      items.length + ' perspective(s), ' +
      items.reduce((n, item) => n + item.views.length, 0) + ' view(s)');
  } else if (command === 'check' && target === 'constraints' && flags.length === 0) {
    checkConstraints(process.cwd());
  } else if (command === 'check' && target === 'all' && flags.length === 0) {
    checkConstraints(process.cwd());
    const result = spawnSync('npm', ['run', 'test', '--if-present'], { stdio: 'inherit' });
    if (result.status !== 0) throw new Error('Tests failed');
    for (const step of ['typecheck', 'build']) {
      const task = spawnSync('npm', ['run', step], { stdio: 'inherit' });
      if (task.status !== 0) throw new Error(step + ' failed');
    }
  } else {
    console.error(help);
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
