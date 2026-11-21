import { ChapterMarkdown } from './ChapterMarkdown';

export interface MarkdownViewProps { view: { markdown: string }; onChapterLink: (file: string) => boolean }
export function MarkdownView({ view, onChapterLink }: MarkdownViewProps) {
  return <ChapterMarkdown markdown={view.markdown} onChapterLink={onChapterLink} />;
}
