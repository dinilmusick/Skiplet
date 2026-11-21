import { Fragment, type ReactNode } from 'react';

interface Props {
  markdown: string;
  onChapterLink: (file: string) => boolean;
  resolveAssetSrc?: (src: string) => string;
}

const inlinePattern = /(!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
const titlePattern = /^(#{1,6})\s+(.+)$/;
const orderedPattern = /^\d+[.)]\s+(.+)$/;
const unorderedPattern = /^[-*+]\s+(.+)$/;

function safeHref(value: string) {
  if (/^(?:https?:\/\/[^\s]+|#[^\s]*|(?:\.{1,2}\/)?[\w./-]+(?:#[^\s]*)?)$/i.test(value)) {
    return value;
  }
  return '#';
}

function inline(
  value: string,
  key: string,
  onChapterLink: Props['onChapterLink'],
  resolveAssetSrc?: Props['resolveAssetSrc'],
): ReactNode[] {
  const tokens: ReactNode[] = [];
  const regex = new RegExp(inlinePattern.source, 'g');
  let previous = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value)) !== null) {
    if (match.index > previous) tokens.push(value.slice(previous, match.index));
    const k = `${key}-${match.index}`;
    if (match[0].startsWith('![')) {
      const rawSrc = safeHref(match[3]);
      const src = resolveAssetSrc ? resolveAssetSrc(rawSrc) : rawSrc;
      tokens.push(
        <img key={k} className="landmark-inline-img" src={src} alt={match[2] ?? ''} referrerPolicy="no-referrer" />,
      );
    } else if (match[4] !== undefined) {
      const href = safeHref(match[5]);
      const file = href.split('#', 1)[0].split('/').pop() ?? '';
      tokens.push(<a key={k} href={href} onClick={event => {
        if (file.endsWith('.md') && onChapterLink(file)) event.preventDefault();
      }}>{match[4]}</a>);
    } else if (match[6] !== undefined) {
      tokens.push(<strong key={k}>{match[6]}</strong>);
    } else if (match[7] !== undefined) {
      tokens.push(<code key={k}>{match[7]}</code>);
    } else if (match[8] !== undefined) {
      tokens.push(<em key={k}>{match[8]}</em>);
    }
    previous = regex.lastIndex;
  }
  if (previous < value.length) tokens.push(value.slice(previous));
  return tokens;
}

function startsBlock(line: string) {
  return titlePattern.test(line) || /^```/.test(line) || /^---+$/.test(line)
    || /^>\s?/.test(line) || orderedPattern.test(line) || unorderedPattern.test(line);
}

export function ChapterMarkdown({ markdown, onChapterLink, resolveAssetSrc }: Props) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const rendered: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    const key = String(i);
    const heading = titlePattern.exec(line);
    if (heading) {
      const depth = heading[1].length;
      const text = inline(heading[2], key, onChapterLink, resolveAssetSrc);
      const Heading = `h${depth}` as 'h1';
      rendered.push(<Heading key={key}>{text}</Heading>);
      i++; continue;
    }
    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) code.push(lines[i++]);
      if (i < lines.length) i++;
      rendered.push(<pre key={key}><code data-language={language}>{code.join('\n')}</code></pre>);
      continue;
    }
    if (/^---+$/.test(line)) { rendered.push(<hr key={key} />); i++; continue; }
    if (line.startsWith('>')) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(lines[i++].trim().replace(/^>\s?/, ''));
      }
      rendered.push(<blockquote key={key}>{inline(quote.join(' '), key, onChapterLink, resolveAssetSrc)}</blockquote>);
      continue;
    }
    const isOrdered = orderedPattern.test(line);
    if (isOrdered || unorderedPattern.test(line)) {
      const items: ReactNode[] = [];
      const itemPattern = isOrdered ? orderedPattern : unorderedPattern;
      while (i < lines.length) {
        const match = itemPattern.exec(lines[i].trim());
        if (!match) break;
        items.push(<li key={i}>{inline(match[1], String(i), onChapterLink, resolveAssetSrc)}</li>);
        i++;
      }
      rendered.push(isOrdered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>);
      continue;
    }
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i].trim())) {
      paragraph.push(lines[i++].trim());
    }
    rendered.push(<p key={key}>{inline(paragraph.join(' '), key, onChapterLink, resolveAssetSrc)}</p>);
  }
  return <div className="chapter-markdown">{rendered.map((node, i) => <Fragment key={i}>{node}</Fragment>)}</div>;
}
