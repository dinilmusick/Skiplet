#!/usr/bin/env node
import { generatePages } from './generate-pages.mjs';

const args = process.argv.slice(2);
const command = args[0] === 'generate' ? args.slice(1) : args;
if (command[0] !== 'pages' || command.some(arg => arg !== 'pages' && arg !== '--check')) {
  console.error('Usage: skiplet generate pages [--check]');
  process.exitCode = 2;
} else {
  try {
    const chapters = generatePages(process.cwd(), command.includes('--check'));
    console.log(`${command.includes('--check') ? 'Verified' : 'Generated'} ${chapters.length} page(s) from exposition/`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
