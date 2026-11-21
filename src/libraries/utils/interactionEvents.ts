import type { AudioEngine, LongAudioClipSpec, SmallCueKind, SmallCueSpec } from './audio';

export type InteractionKind = 'scroll' | 'click' | 'landmark-enter' | 'landmark-exit';

export interface InteractionEventPayload {
  kind: InteractionKind;
  intensity: number;
  direction?: -1 | 1;
  landmarkId?: string;
}

export type InteractionListener = (event: InteractionEventPayload) => void;

export interface InteractionBus {
  emitScroll: (direction?: -1 | 1, intensity?: number, cue?: SmallCueKind) => void;
  emitClick: (cue?: SmallCueKind, overrides?: Partial<SmallCueSpec>) => void;
  emitLandmarkEnter: (landmarkId: string, clip?: LongAudioClipSpec, sfx?: Partial<SmallCueSpec>) => void;
  emitLandmarkExit: (landmarkId: string, sfx?: Partial<SmallCueSpec>) => void;
  subscribe: (listener: InteractionListener) => () => void;
}

/** Coordinates audio playback and visual/lighting reactions across carousels and scenes. */
export function createInteractionBus(audio: AudioEngine): InteractionBus {
  const listeners = new Set<InteractionListener>();
  const notify = (event: InteractionEventPayload) => {
    listeners.forEach(fn => fn(event));
  };

  return {
    emitScroll: (direction, intensity = 1, cue = 'scroll-step') => {
      audio.unlock();
      audio.playSmallCue(cue);
      notify({ kind: 'scroll', intensity, direction });
    },
    emitClick: (cue = 'button-click', overrides) => {
      audio.unlock();
      audio.playSmallCue(cue, overrides);
      notify({ kind: 'click', intensity: 0.7 });
    },
    emitLandmarkEnter: (landmarkId, clip, sfx) => {
      audio.unlock();
      audio.playSmallCue('landmark-enter', sfx);
      if (clip) audio.playLongClip(clip);
      notify({ kind: 'landmark-enter', intensity: 1, landmarkId });
    },
    emitLandmarkExit: (landmarkId, sfx) => {
      audio.unlock();
      audio.playSmallCue('landmark-exit', sfx);
      audio.stopLongClip(0.35);
      notify({ kind: 'landmark-exit', intensity: 0.8, landmarkId });
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
