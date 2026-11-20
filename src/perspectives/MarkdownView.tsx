import { ChapterMarkdown } from '../libraries/components/ChapterMarkdown';
import type { ViewProps } from './types';
export function MarkdownView({ view, onChapterLink }: ViewProps) {
  return <ChapterMarkdown markdown={view.markdown} onChapterLink={onChapterLink} />;
}
