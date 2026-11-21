import { useMemo, type ComponentType } from 'react';
import config from '../../meditations.config.json';
import { DirectionalCarousel3D } from '../libraries/components/DirectionalCarousel3D';
import { Annotated3DScene } from '../libraries/components/Annotated3DScene';
import { MarkdownView } from './MarkdownView';
import { createScaffoldViewScene, createViewLandmarks } from './viewScenes';
import type { PerspectiveProps, ViewProps } from './types';

interface Props extends PerspectiveProps {
  viewComponents: Readonly<Record<string, ComponentType<ViewProps>>>;
}
export function PerspectiveStage({
  perspective, activeView, onSelectView, onChapterLink, onBack, viewComponents,
}: Props) {
  const items = useMemo(() => perspective.views.map(view => ({
    id: view.slug, title: view.title, view,
  })), [perspective.views]);
  const scenes = useMemo(() => perspective.views.map((_view, index) =>
    createScaffoldViewScene(perspective.number, index)),
  [perspective.number, perspective.views]);
  const landmarks = useMemo(() => perspective.views.map(createViewLandmarks), [perspective.views]);

  return <section className="exhibition-interior annotated-perspective"
    aria-label={'Perspective: ' + perspective.title}>
    <DirectionalCarousel3D items={items} activeIndex={activeView}
      onSelect={onSelectView} renderScene={(item, index, active) => {
        const View = viewComponents[item.view.slug] ?? MarkdownView;
        return <Annotated3DScene key={item.id} createScene={scenes[index]}
          annotations={landmarks[index]} backgroundColor={config.palette.base}
          lightingColor={config.palette.text} active={active}
          renderText={note => <View
            view={{ ...item.view, markdown: note.body }} onChapterLink={onChapterLink} />} />;
      }} />
    <header className="perspective-chrome">
      <button type="button" className="scaffold-back-icon" onClick={onBack}
        aria-label="Back to perspective carousel">←</button>
      <div className="perspective-chrome-title">
        <h1>{perspective.title}</h1>
      </div>
    </header>
  </section>;
}
