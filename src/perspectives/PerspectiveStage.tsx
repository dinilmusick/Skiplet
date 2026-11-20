import type { ComponentType } from 'react';
import { ViewNavigation } from '../libraries/components/ViewNavigation';
import { MarkdownView } from './MarkdownView';
import type { PerspectiveProps, ViewProps } from './types';

interface Props extends PerspectiveProps {
  viewComponents: Readonly<Record<string, ComponentType<ViewProps>>>;
}
export function PerspectiveStage({ perspective, activeView, onSelectView,
  onChapterLink, onBack, viewComponents }: Props) {
  const view = perspective.views[activeView] ?? perspective.views[0];
  const View = view ? (viewComponents[view.slug] ?? MarkdownView) : MarkdownView;
  return <section className="exhibition-interior" aria-label={'Perspective: ' + perspective.title}>
    <div className="exhibition-interior-heading">
      <button type="button" onClick={onBack} className="exhibition-enter">← Back to carousel</button>
      <span>PERSPECTIVE {String(perspective.number).padStart(2, '0')}</span>
      <h1>{perspective.title}</h1>
    </div>
    <ViewNavigation views={perspective.views} active={activeView} onSelect={onSelectView} />
    {view && <article className="exhibition-chapter" aria-label={'View: ' + view.title}>
      <View view={view} onChapterLink={onChapterLink} />
    </article>}
  </section>;
}
