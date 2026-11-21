import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { attachLandmarkNavigation } from '../src/libraries/components/Annotated3DScene/landmarkNavigation.ts';

const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Vite prebundles one React graph and supports an explicit HMR opt-in', () => {
  const config = source('vite.config.ts');
  assert.match(config, /dedupe:\s*\['react',\s*'react-dom'\]/);
  for (const id of ['react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'three']) {
    assert.ok(config.includes("'" + id + "'"), 'prebundle ' + id);
  }
  assert.match(config, /hmr:\s*mode\s*===\s*'dev-hmr'/);
  assert.doesNotMatch(config, /allowedHosts:\s*true/);
});

test('shared components retain root event routing, parent lock and safe timing', () => {
  const scene = source('src/libraries/components/Annotated3DScene/Annotated3DScene.tsx');
  const carousel = source('src/libraries/components/DirectionalCarousel3D/DirectionalCarousel3D.tsx');
  const mount = source('src/libraries/components/Annotated3DScene/mountAnnotatedScene.ts');
  const outer = source('src/libraries/components/Carousel3D/Carousel3D.tsx');
  const projector = source('src/libraries/components/3d/canvas3dProjector.ts');
  assert.match(scene, /attachLandmarkNavigation\(\s*sceneRef\.current/);
  assert.match(carousel, /hasOpenLandmark\(event\.currentTarget, event\.target\)/);
  assert.match(mount, /!activeRef\.current && renderedOnce/);
  assert.match(mount, /scheduleAfterDraw/);
  assert.match(outer, /performance\.now\(\)/);
  assert.doesNotMatch(outer, /new THREE\.Clock\(/);
  assert.match(projector, /Math\.min\(6\.5/);
});

test('landmark wheel events remain in the scene and never leak to view navigation', () => {
  const previousElement = globalThis.Element;
  const previousWindow = globalThis.window;
  const windowListeners = new Map();
  globalThis.window = {
    addEventListener: (name, callback) => windowListeners.set(name, callback),
    removeEventListener: name => windowListeners.delete(name),
  };
  class FakeElement {
    constructor(copy = null) { this.copy = copy; }
    closest() { return this.copy; }
  }
  globalThis.Element = FakeElement;
  try {
    const handlers = new Map();
    const container = {
      addEventListener: (name, callback) => handlers.set(name, callback),
      removeEventListener: name => handlers.delete(name),
    };
    const notes = [{ id: 'a' }, { id: 'b' }];
    const opened = [];
    const dispose = attachLandmarkNavigation(container, true, notes[0], notes,
      undefined, note => opened.push(note.id), () => {});
    assert.equal(typeof handlers.get('wheel'), 'function');
    let prevented = false, stopped = false;
    const wheel = {
      deltaX: 0, deltaY: 90, target: new FakeElement(),
      preventDefault() { prevented = true; },
      stopPropagation() { stopped = true; },
    };
    handlers.get('wheel')(wheel);
    assert.deepEqual(opened, ['b']);
    assert.equal(prevented, true);
    assert.equal(stopped, true);
    dispose();
    assert.equal(handlers.has('wheel'), false);

    const single = attachLandmarkNavigation(container, true, notes[0], notes.slice(0, 1),
      undefined, () => {}, () => {});
    prevented = false; stopped = false;
    handlers.get('wheel')(wheel);
    assert.equal(prevented, true);
    assert.equal(stopped, true);
    single();

    const copy = { scrollHeight: 600, clientHeight: 100, scrollTop: 0 };
    const scroll = attachLandmarkNavigation(container, true, notes[0], notes,
      undefined, () => opened.push('unexpected'), () => {});
    prevented = false; stopped = false;
    handlers.get('wheel')({ ...wheel, target: new FakeElement(copy) });
    assert.equal(prevented, false, 'native text scrolling remains available');
    assert.equal(stopped, true, 'text wheel never reaches parent carousel');
    assert.deepEqual(opened, ['b']);
    scroll();
  } finally {
    globalThis.Element = previousElement;
    globalThis.window = previousWindow;
  }
});

test('bare icon controls are styled in reusable CSS, not application-only styles', () => {
  assert.match(source('src/main.tsx'), /libraries\/styles\/controls\.css/);
  const css = source('src/libraries/styles/controls.css');
  assert.match(css, /\.icon-circle-btn/);
  assert.match(css, /\.audio-toggle-btn/);
  assert.doesNotMatch(source('src/perspectives/styles/interior.css'), /\.icon-circle-btn\s*\{/);
});
