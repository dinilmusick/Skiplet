import { existsSync } from 'node:fs';
const expected=['meditations.config.json','src/main.tsx','src/style.css'];
const missing=expected.filter(file=>!existsSync(file));
if(missing.length){console.error('Missing:',missing.join(', '));process.exitCode=1;}
else console.log('Skipo promotion preflight passed; adoption must be explicitly verified against the installed Skipo CLI.');
