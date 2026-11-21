import type { AmbientLayerSpec, LongAudioClipSpec } from './types';

export interface AmbientVoice {
  setMood: (mood: number) => void;
  setDuck: (duck: number) => void;
  dispose: () => void;
}

export function buildAmbientVoice(ctx: AudioContext, dest: AudioNode, spec: AmbientLayerSpec): AmbientVoice {
  const now = ctx.currentTime;
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0.0001, now);
  bus.gain.linearRampToValueAtTime(spec.gain, now + 1.4);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(620, now);
  bus.connect(filter);
  filter.connect(dest);

  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  const oscC = ctx.createOscillator();
  const gB = ctx.createGain();
  const gC = ctx.createGain();
  oscA.type = 'sine'; oscB.type = 'triangle'; oscC.type = 'sine';
  oscA.frequency.setValueAtTime(spec.baseHz, now);
  oscB.frequency.setValueAtTime(spec.fifthHz, now);
  oscC.frequency.setValueAtTime(spec.shimmerHz, now);
  gB.gain.setValueAtTime(0.32, now);
  gC.gain.setValueAtTime(0.14, now);

  oscA.connect(bus);
  oscB.connect(gB); gB.connect(bus);
  oscC.connect(gC); gC.connect(bus);
  oscA.start(now); oscB.start(now); oscC.start(now);

  let moodVal = 0, duckVal = 1;
  const apply = () => {
    const t = ctx.currentTime;
    oscA.frequency.setTargetAtTime(spec.baseHz * (1 + moodVal * 0.12), t, 0.35);
    oscB.frequency.setTargetAtTime(spec.fifthHz * (1 + moodVal * 0.08), t, 0.35);
    oscC.frequency.setTargetAtTime(spec.shimmerHz * (1 + moodVal * 0.25), t, 0.35);
    filter.frequency.setTargetAtTime(520 + moodVal * 440, t, 0.4);
    bus.gain.setTargetAtTime(spec.gain * duckVal, t, 0.25);
  };

  return {
    setMood: mood => { moodVal = Math.max(0, Math.min(1, mood)); apply(); },
    setDuck: duck => { duckVal = Math.max(0.15, Math.min(1, duck)); apply(); },
    dispose: () => {
      bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12);
      window.setTimeout(() => {
        try { oscA.stop(); oscB.stop(); oscC.stop(); bus.disconnect(); } catch { /* noop */ }
      }, 350);
    },
  };
}

export interface LongClipPlayer {
  readEnvelope: () => { progress: number; amplitude: number; beatPhase: number; finished: boolean };
  stop: (fadeSeconds?: number) => void;
}

export function startLongClipVoice(ctx: AudioContext, dest: AudioNode, spec: LongAudioClipSpec): LongClipPlayer {
  const startAt = ctx.currentTime;
  const bus = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1400, startAt);

  const analyser = ctx.createAnalyser();
  analyser.fftSize = 128;
  const bins = new Uint8Array(analyser.frequencyBinCount);

  bus.gain.setValueAtTime(0.0001, startAt);
  bus.gain.linearRampToValueAtTime(spec.gain ?? 0.14, startAt + 0.65);
  bus.connect(filter);
  filter.connect(analyser);
  analyser.connect(dest);

  const drone = ctx.createOscillator();
  const droneGain = ctx.createGain();
  drone.type = 'triangle';
  drone.frequency.setValueAtTime(spec.baseHz * 0.5, startAt);
  droneGain.gain.setValueAtTime(0.38, startAt);
  drone.connect(droneGain); droneGain.connect(bus);
  drone.start(startAt);

  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(spec.pulseHz, startAt);
  lfoGain.gain.setValueAtTime(420, startAt);
  lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
  lfo.start(startAt);

  let stepTimer = 0, stepIdx = 0, stopped = false;
  const scheduleStep = () => {
    if (stopped) return;
    if (!spec.loop && ctx.currentTime - startAt >= spec.durationSeconds) return;
    const now = ctx.currentTime;
    const ratio = spec.intervals[stepIdx % spec.intervals.length] ?? 1;
    stepIdx += 1;
    const voice = ctx.createOscillator();
    const vGain = ctx.createGain();
    voice.type = stepIdx % 3 === 0 ? 'triangle' : 'sine';
    voice.frequency.setValueAtTime(spec.baseHz * ratio, now);
    const beatDur = 1 / Math.max(0.25, spec.pulseHz);
    vGain.gain.setValueAtTime(0.0001, now);
    vGain.gain.linearRampToValueAtTime(0.45, now + 0.08);
    vGain.gain.exponentialRampToValueAtTime(0.0001, now + beatDur * 1.6);
    voice.connect(vGain); vGain.connect(bus);
    voice.start(now); voice.stop(now + beatDur * 1.7);
    stepTimer = window.setTimeout(scheduleStep, Math.round(beatDur * 1000));
  };
  scheduleStep();

  const stop = (fadeSeconds = 0.45) => {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(stepTimer);
    const t = ctx.currentTime;
    bus.gain.cancelScheduledValues(t);
    bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), t);
    bus.gain.exponentialRampToValueAtTime(0.0001, t + fadeSeconds);
    window.setTimeout(() => {
      try { drone.stop(); lfo.stop(); bus.disconnect(); } catch { /* noop */ }
    }, Math.round(fadeSeconds * 1000) + 80);
  };

  return {
    readEnvelope: () => {
      const elapsed = Math.max(0, ctx.currentTime - startAt);
      const finished = !spec.loop && elapsed >= spec.durationSeconds;
      const progress = spec.loop
        ? (elapsed % spec.durationSeconds) / spec.durationSeconds
        : Math.min(1, elapsed / spec.durationSeconds);
      analyser.getByteTimeDomainData(bins);
      let sum = 0;
      for (let i = 0; i < bins.length; i++) {
        const v = (bins[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.min(1, Math.sqrt(sum / bins.length) * 4.2);
      const synthPulse = 0.32 + 0.68 * Math.abs(Math.sin(elapsed * Math.PI * spec.pulseHz));
      return {
        progress,
        amplitude: stopped || finished ? 0 : Math.max(rms, synthPulse * 0.42),
        beatPhase: (elapsed * spec.pulseHz) % 1,
        finished,
      };
    },
    stop,
  };
}
