import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync('meditations.config.json', 'utf8'));
for (const field of ['id', 'title', 'concept', 'artStyle', 'colorScheme']) {
  if (typeof config[field] !== 'string' || !config[field].trim()) {
    throw new Error('Missing required meditation configuration: ' + field);
  }
}
if (!config.id.startsWith('MDT-')) throw new Error('Meditation id must begin MDT-');
for (const field of ['truthTags', 'emotionTags', 'artTags', 'materials', 'textures']) {
  if (!Array.isArray(config[field]) || config[field].length === 0) {
    throw new Error('Expected a nonempty array for ' + field);
  }
}
console.log('Meditation title, art direction, and configuration verified');
