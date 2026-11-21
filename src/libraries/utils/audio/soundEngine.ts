import { DEFAULT_CUE_SPECS, triggerSmallCue } from './cueSynth.ts';
import {
  buildAmbientVoice,
  startLongClipVoice,
  type AmbientVoice,
  type LongClipPlayer,
} from './ambientAndClips.ts';
import { createSpatialVoice } from './spatialVoice.ts';
import type {
  AmbientLayerSpec,
  AudioEngine,
  AudioEnvelopeFrame,
  LongAudioClipSpec,
  SmallCueKind,
  SmallCueSpec,
  SpatialAudioSpec,
} from './types';

const DEFAULT_AMBIENT: AmbientLayerSpec = {
  baseHz: 73.42,
  fifthHz: 110.0,
  shimmerHz: 220.0,
  gain: 0.042,
};

export function createAudioEngine(): AudioEngine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = false;
  let ambientSpec: AmbientLayerSpec | null = null;
  let ambientVoice: AmbientVoice | null = null;
  let activeClip: { id: string; spec: LongAudioClipSpec; startedAt: number; player: LongClipPlayer | null } | null = null;
  const listeners = new Set<(muted: boolean) => void>();
  const spatialNodes = new Set<() => void>();

  const ensureContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) {
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.setValueAtTime(muted ? 0 : 0.85, ctx.currentTime);
      master.connect(ctx.destination);
    }
    return ctx;
  };

  const unlock = () => {
    const audio = ensureContext();
    if (!audio) return;
    if (audio.state === 'suspended') void audio.resume().catch(() => {});
    if (ambientSpec && !ambientVoice && master) {
      ambientVoice = buildAmbientVoice(audio, master, ambientSpec);
    }
  };

  const onGesture = () => unlock();
  if (typeof window !== 'undefined') {
    window.addEventListener('pointerdown', onGesture, { passive: true });
    window.addEventListener('keydown', onGesture, { passive: true });
    window.addEventListener('wheel', onGesture, { passive: true });
  }

  const playSmallCue = (kind: SmallCueKind, overrides?: Partial<SmallCueSpec>) => {
    if (muted) return;
    const audio = ensureContext();
    if (!audio || !master || audio.state !== 'running') return;
    triggerSmallCue(audio, master, { ...DEFAULT_CUE_SPECS[kind], ...overrides });
  };

  const stopLongClip = (fadeSeconds = 0.4) => {
    if (!activeClip) return;
    activeClip.player?.stop(fadeSeconds);
    activeClip = null;
    ambientVoice?.setDuck(1);
  };

  const playLongClip = (spec: LongAudioClipSpec) => {
    stopLongClip(0.25);
    const audio = ensureContext();
    const player = !muted && audio && master && audio.state === 'running'
      ? startLongClipVoice(audio, master, spec)
      : null;
    activeClip = { id: spec.id, spec, startedAt: performance.now(), player };
    ambientVoice?.setDuck(0.45);
  };

  const getClipEnvelope = (): AudioEnvelopeFrame => {
    if (!activeClip) return { active: false, clipId: null, progress: 0, amplitude: 0, beatPhase: 0 };
    if (activeClip.player) {
      const env = activeClip.player.readEnvelope();
      if (env.finished) {
        stopLongClip(0.2);
        return { active: false, clipId: null, progress: 1, amplitude: 0, beatPhase: 0 };
      }
      return { active: true, clipId: activeClip.id, ...env };
    }
    const elapsed = (performance.now() - activeClip.startedAt) / 1000;
    const dur = Math.max(0.5, activeClip.spec.durationSeconds);
    if (!activeClip.spec.loop && elapsed >= dur) {
      activeClip = null;
      return { active: false, clipId: null, progress: 1, amplitude: 0, beatPhase: 0 };
    }
    const progress = activeClip.spec.loop ? (elapsed % dur) / dur : Math.min(1, elapsed / dur);
    const amplitude = 0.35 + 0.5 * Math.abs(Math.sin(elapsed * Math.PI * activeClip.spec.pulseHz));
    return { active: true, clipId: activeClip.id, progress, amplitude, beatPhase: (elapsed * activeClip.spec.pulseHz) % 1 };
  };

  const startAmbient = (spec: AmbientLayerSpec = DEFAULT_AMBIENT) => {
    ambientSpec = spec;
    const audio = ensureContext();
    if (audio && master && audio.state === 'running' && !ambientVoice) {
      ambientVoice = buildAmbientVoice(audio, master, spec);
    }
  };

  const registerSpatialSource = (spec: SpatialAudioSpec) => {
    const handle = createSpatialVoice(
      spec,
      () => ({ ctx, master, muted }),
      fn => spatialNodes.delete(fn),
    );
    spatialNodes.add(handle.dispose);
    return handle;
  };

  const setMuted = (next: boolean) => {
    muted = next;
    if (ctx && master) master.gain.setTargetAtTime(muted ? 0.0001 : 0.85, ctx.currentTime, 0.05);
    if (muted) stopLongClip(0.15);
    listeners.forEach(fn => fn(muted));
  };

  return {
    unlock,
    isMuted: () => muted,
    setMuted,
    toggleMuted: () => {
      const next = !muted;
      setMuted(next);
      if (!next) { unlock(); playSmallCue('button-click'); }
      return next;
    },
    subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); },
    playSmallCue,
    playLongClip,
    stopLongClip,
    getClipEnvelope,
    startAmbient,
    setAmbientMood: mood => ambientVoice?.setMood(mood),
    stopAmbient: () => { ambientSpec = null; ambientVoice?.dispose(); ambientVoice = null; },
    registerSpatialSource,
    dispose: () => {
      stopLongClip(0.1);
      ambientSpec = null; ambientVoice?.dispose(); ambientVoice = null;
      Array.from(spatialNodes).forEach(fn => fn());
      if (typeof window !== 'undefined') {
        window.removeEventListener('pointerdown', onGesture);
        window.removeEventListener('keydown', onGesture);
        window.removeEventListener('wheel', onGesture);
      }
      void ctx?.close().catch(() => {});
    },
  };
}

let shared: AudioEngine | null = null;
export function getSharedAudioEngine(): AudioEngine {
  if (!shared) shared = createAudioEngine();
  return shared;
}
