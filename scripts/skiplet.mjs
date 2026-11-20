#!/usr/bin/env node
import { generatePages } from './generate-pages.mjs';

const args = process.argv.slice(2);
const command = args[0] === 'generate' ? args.slice(1) : args;
const target = command[0];
if (!['pages', 'perspectives'].includes(target) ||
    command.some(arg => !['pages', 'perspectives', '--check'].includes(arg))) {
  console.error('Usage: skiplet generate perspectives [--check] (alias: generate pages)');
  process.exitCode = 2;
} else {
  try {
    const checking = command.includes('--check');
    const perspectives = generatePages(process.cwd(), checking);
    const views = perspectives.reduce((sum, item) => sum + item.views.length, 0);
    console.log((checking ? 'Verified ' : 'Generated ') + perspectives.length +
      ' perspective(s), ' + views + ' view(s)');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
