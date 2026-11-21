import type { SmallCueKind, SmallCueSpec } from './types';

export const DEFAULT_CUE_SPECS: Readonly<Record<SmallCueKind, SmallCueSpec>> = {
  'scroll-tick': {
    category: 'scroll', frequency: 420, endFrequency: 510,
    durationMs: 42, gain: 0.045, waveform: 'sine', filterHz: 1800,
  },
  'scroll-step': {
    category: 'scroll', frequency: 240, endFrequency: 360,
    durationMs: 125, gain: 0.085, waveform: 'triangle', harmonicRatio: 1.5, filterHz: 2100,
  },
  'button-click': {
    category: 'click', frequency: 580, endFrequency: 440,
    durationMs: 55, gain: 0.07, waveform: 'sine', filterHz: 2400,
  },
  'landmark-enter': {
    category: 'landmark', frequency: 293.66, endFrequency: 440,
    durationMs: 240, gain: 0.12, waveform: 'triangle', harmonicRatio: 1.5, filterHz: 3200,
  },
  'landmark-exit': {
    category: 'landmark', frequency: 392, endFrequency: 246.94,
    durationMs: 190, gain: 0.095, waveform: 'sine', harmonicRatio: 1.25, filterHz: 2200,
  },
};

export function triggerSmallCue(ctx: AudioContext, dest: AudioNode, spec: SmallCueSpec) {
  const now = ctx.currentTime;
  const dur = Math.max(0.03, spec.durationMs / 1000);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(spec.filterHz ?? 2400, now);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(spec.gain, now + Math.min(0.014, dur * 0.2));
  env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  filter.connect(env);
  env.connect(dest);

  const osc = ctx.createOscillator();
  osc.type = spec.waveform ?? 'sine';
  osc.frequency.setValueAtTime(spec.frequency, now);
  if (spec.endFrequency && spec.endFrequency > 0) {
    osc.frequency.exponentialRampToValueAtTime(spec.endFrequency, now + dur);
  }
  osc.connect(filter);
  osc.start(now);
  osc.stop(now + dur + 0.02);

  if (spec.harmonicRatio) {
    const overtone = ctx.createOscillator();
    const overtoneGain = ctx.createGain();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(spec.frequency * spec.harmonicRatio, now);
    if (spec.endFrequency && spec.endFrequency > 0) {
      overtone.frequency.exponentialRampToValueAtTime(spec.endFrequency * spec.harmonicRatio, now + dur);
    }
    overtoneGain.gain.setValueAtTime(0.35, now);
    overtone.connect(overtoneGain);
    overtoneGain.connect(filter);
    overtone.start(now);
    overtone.stop(now + dur + 0.02);
  }
}
