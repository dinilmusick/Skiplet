import { useEffect, useState } from 'react';
import type { AudioEngine } from '../utils/audio';

export function AudioToggleButton({ audio }: { audio: AudioEngine }) {
  const [muted, setMuted] = useState(() => audio.isMuted());

  useEffect(() => audio.subscribe(setMuted), [audio]);

  return (
    <button
      type="button"
      className="icon-circle-btn audio-toggle-btn"
      data-audio-toggle
      aria-label={muted ? 'Unmute audio' : 'Mute audio'}
      aria-pressed={!muted}
      onClick={() => audio.toggleMuted()}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {muted ? (
          <>
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </>
        ) : (
          <>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </>
        )}
      </svg>
    </button>
  );
}
