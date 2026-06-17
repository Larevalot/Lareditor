interface Translations {
  [key: string]: string;
}

interface Props {
  volume: number;
  onVolumeChange: (volume: number) => void;
  t: Translations;
}

export function MainVideo({ volume, onVolumeChange, t }: Props) {
  return (
    <div className="main-video-panel">
      <h3>{t.mainVideo}</h3>

      <div className="control-group">
        <span className="control-label">{t.volume}</span>
        <label className="volume-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            {volume > 0 ? (
              volume > 0.5 ? (
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              ) : (
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              )
            ) : (
              <>
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </>
            )}
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => onVolumeChange(+e.target.value)}
          />
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </label>
      </div>
    </div>
  );
}
