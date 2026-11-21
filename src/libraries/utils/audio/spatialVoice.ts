import * as THREE from 'three';
import { computeSpatialParams } from './spatial3d.ts';
import type { SpatialAudioHandle, SpatialAudioSpec } from './types';

const _camPos = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _camForward = new THREE.Vector3();

export function createSpatialVoice(
  spec: SpatialAudioSpec,
  getContext: () => { ctx: AudioContext | null; master: GainNode | null; muted: boolean },
  onDispose: (disposeFn: () => void) => void,
): SpatialAudioHandle {
  let proximity = 0;
  let disposed = false;
  let osc: OscillatorNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let panner: StereoPannerNode | null = null;
  let gainNode: GainNode | null = null;

  const ensureNodes = () => {
    const { ctx, master, muted } = getContext();
    if (disposed || muted || osc || !ctx || !master || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(spec.baseHz, now);

    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    panner = typeof ctx.createStereoPanner === 'function' ? ctx.createStereoPanner() : null;
    gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, now);

    osc.connect(filter);
    if (panner) {
      filter.connect(panner);
      panner.connect(gainNode);
    } else {
      filter.connect(gainNode);
    }
    gainNode.connect(master);
    osc.start(now);
  };

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    onDispose(dispose);
    const { ctx } = getContext();
    if (osc && ctx) {
      gainNode?.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
      const oldOsc = osc;
      const oldGain = gainNode;
      window.setTimeout(() => {
        try { oldOsc.stop(); oldGain?.disconnect(); } catch { /* noop */ }
      }, 250);
    }
    osc = null;
  };

  return {
    update: (camera, worldPos) => {
      if (disposed) return;
      camera.getWorldPosition(_camPos);
      _camRight.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
      _camForward.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      const params = computeSpatialParams(
        _camPos, _camRight, _camForward, worldPos, spec.maxDistance ?? 26, spec.refDistance ?? 3.5,
      );
      proximity = params.gain;
      ensureNodes();
      const { ctx, muted } = getContext();
      if (!ctx || !gainNode || !filter || ctx.state !== 'running') return;
      const t = ctx.currentTime;
      const targetGain = muted ? 0.0001 : Math.max(0.0001, params.gain * (spec.gain ?? 0.055));
      gainNode.gain.setTargetAtTime(targetGain, t, 0.08);
      filter.frequency.setTargetAtTime(params.cutoffHz, t, 0.08);
      panner?.pan.setTargetAtTime(params.pan, t, 0.08);
    },
    getProximity: () => proximity,
    dispose,
  };
}
