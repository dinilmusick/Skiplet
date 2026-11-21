import * as THREE from 'three';
import { Canvas3DRenderer } from '../3d/Canvas3DRenderer.ts';

export type StageRenderer = THREE.WebGLRenderer | Canvas3DRenderer;

export interface WebGlProfile {
  supported: boolean;
  isWebGl2: boolean;
  isSoftwareGl: boolean;
}

export function detectWebGlProfile(): WebGlProfile {
  try {
    const probe = document.createElement('canvas');
    const gl2 = probe.getContext('webgl2') as WebGL2RenderingContext | null;
    const gl = gl2
      ?? (probe.getContext('webgl') as WebGLRenderingContext | null)
      ?? (probe.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return { supported: false, isWebGl2: false, isSoftwareGl: true };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return { supported: true, isWebGl2: Boolean(gl2), isSoftwareGl };
  } catch {
    return { supported: false, isWebGl2: false, isSoftwareGl: true };
  }
}

export function detectSoftwareWebGl(): boolean {
  return detectWebGlProfile().isSoftwareGl;
}

export function createStageRenderer(mount: HTMLElement, forceCanvas3D = false): {
  renderer: StageRenderer;
  isWebGl: boolean;
  isWebGl2: boolean;
  isSoftwareGl: boolean;
} {
  const profile = forceCanvas3D
    ? { supported: false, isWebGl2: false, isSoftwareGl: true }
    : detectWebGlProfile();
  const w = mount.clientWidth || window.innerWidth;
  const h = mount.clientHeight || window.innerHeight;

  if (profile.supported && !profile.isSoftwareGl) {
    try {
      const canvas = document.createElement('canvas');
      const attrs: WebGLContextAttributes = {
        alpha: false,
        antialias: !profile.isSoftwareGl,
        powerPreference: 'high-performance',
      };
      const context = (profile.isWebGl2
        ? canvas.getContext('webgl2', attrs)
        : (canvas.getContext('webgl', attrs) ?? canvas.getContext('experimental-webgl', attrs))) as
        | WebGLRenderingContext
        | WebGL2RenderingContext
        | null;

      if (context) {
        const renderer = new THREE.WebGLRenderer({
          canvas,
          context,
          antialias: !profile.isSoftwareGl,
          powerPreference: 'high-performance',
        });
        renderer.debug.checkShaderErrors = false;
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.94;
        renderer.setPixelRatio(profile.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        renderer.shadowMap.enabled = !profile.isSoftwareGl;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mount.appendChild(renderer.domElement);
        return {
          renderer,
          isWebGl: true,
          isWebGl2: profile.isWebGl2,
          isSoftwareGl: profile.isSoftwareGl,
        };
      }
    } catch {
      // Fall through cleanly to Canvas3DRenderer on legacy / broken WebGL drivers
    }
  }

  const renderer = new Canvas3DRenderer(mount);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(w, h);
  return { renderer, isWebGl: false, isWebGl2: false, isSoftwareGl: true };
}

export function scheduleAfterDraw(
  renderer: StageRenderer,
  cb: () => void,
  setTimer: (id: number) => void,
) {
  if (!(renderer instanceof THREE.WebGLRenderer)) {
    setTimer(window.setTimeout(cb, 80));
    return;
  }
  const gl = renderer.getContext() as WebGL2RenderingContext;
  if (!gl || typeof gl.fenceSync !== 'function') {
    setTimer(window.setTimeout(cb, 60));
    return;
  }
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  const poll = () => {
    const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
    if (state === gl.UNSIGNALED) {
      setTimer(window.setTimeout(poll, 5));
    } else {
      if (sync) gl.deleteSync(sync);
      setTimer(window.setTimeout(cb, 80));
    }
  };
  setTimer(window.setTimeout(poll, 5));
}
