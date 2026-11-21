export interface LandmarkMarkdownItem {
  index: number;
  body: string;
  excerpt: string;
}

function summarizeMarkdown(markdown: string): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= 52) return plain || 'Landmark note';
  return plain.slice(0, 49).trimEnd() + '...';
}

function stripLeadingHeading(lines: string[]): string[] {
  let start = 0;
  while (start < lines.length && !lines[start].trim()) start++;
  if (start < lines.length && /^#{1,2}\s+/.test(lines[start].trim())) start++;
  return lines.slice(start);
}

function stripTrailingFooter(lines: string[]): string[] {
  let fence = '';
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const fenceMatch = /^(`{3,}|~{3,})/.exec(trimmed);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fence === fenceMatch[1][0]) fence = '';
      continue;
    }
    if (!fence && /^---+$/.test(trimmed)) return lines.slice(0, i);
  }
  return lines;
}

function finalizeBullet(rawLines: string[], index: number): LandmarkMarkdownItem {
  const cleaned = [...rawLines];
  while (cleaned.length && !cleaned[cleaned.length - 1].trim()) cleaned.pop();
  const body = cleaned.join('\n').trim();
  return { index, body, excerpt: summarizeMarkdown(body) };
}

/**
 * Splits a view section's Markdown into individual bulleted items.
 * Every `- ` bulleted line (along with any indented equation or picture continuation)
 * corresponds to exactly one landmark.
 */
export function extractLandmarkItems(markdown: string): LandmarkMarkdownItem[] {
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').split('\n');
  const lines = stripTrailingFooter(stripLeadingHeading(normalized));

  const items: LandmarkMarkdownItem[] = [];
  let current: string[] | null = null;
  let fence = '';

  for (const line of lines) {
    const trimmed = line.trim();
    const withoutTwo = line.startsWith('  ') ? line.slice(2) : line.startsWith('\t') ? line.slice(1) : line;
    const fenceMatch = /^(`{3,}|~{3,})/.exec(withoutTwo.trim());

    if (!fence) {
      const bulletMatch = /^-\s+(.+)$/.exec(line);
      if (bulletMatch) {
        if (current) items.push(finalizeBullet(current, items.length));
        current = [bulletMatch[1]];
        continue;
      }
    }

    if (current) {
      if (fenceMatch) {
        if (!fence) fence = fenceMatch[1][0];
        else if (fence === fenceMatch[1][0]) fence = '';
      }
      if (!trimmed) {
        current.push('');
      } else if (/^\s{2,}|\t/.test(line) || fence) {
        current.push(withoutTwo);
      } else {
        items.push(finalizeBullet(current, items.length));
        current = null;
      }
    }
  }
  if (current) items.push(finalizeBullet(current, items.length));

  if (!items.length) {
    const fallback = lines.join('\n').trim();
    if (fallback) items.push({ index: 0, body: fallback, excerpt: summarizeMarkdown(fallback) });
  }
  return items;
}
