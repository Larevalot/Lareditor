import { useState } from 'react';

interface Translations {
  [key: string]: string;
}

interface CanvasConfig {
  width: number;
  height: number;
  fps: number;
  backgroundColor: string;
}

interface Props {
  config: CanvasConfig;
  onUpdate: (updates: Partial<CanvasConfig>) => void;
  videoDuration: number;
  onDurationChange: (duration: number) => void;
  t: Translations;
}

const RESOLUTION_PRESETS = [
  { label: '1080p', width: 1920, height: 1080 },
  { label: '720p', width: 1280, height: 720 },
  { label: '480p', width: 854, height: 480 },
  { label: 'Vertical', width: 1080, height: 1920 },
  { label: 'Cuadrado', width: 1080, height: 1080 },
];

const FPS_OPTIONS = [24, 25, 30, 60];

export function CanvasSettings({ config, onUpdate, videoDuration, onDurationChange, t }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentRes = RESOLUTION_PRESETS.find(
    (r) => r.width === config.width && r.height === config.height
  );

  return (
    <div className="canvas-settings-panel">
      <div
        className="canvas-settings-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3>{t.canvasSettings}</h3>
        <span className="canvas-settings-arrow">
          {isExpanded ? '▼' : '▶'}
        </span>
      </div>

      {isExpanded && (
        <div className="canvas-settings-content">
          <div className="control-group">
            <span className="control-label">{t.resolution}</span>
            <div className="resolution-chips">
              {RESOLUTION_PRESETS.map((r) => (
                <button
                  key={r.label}
                  className={`resolution-chip ${currentRes?.label === r.label ? 'active' : ''}`}
                  onClick={() => onUpdate({ width: r.width, height: r.height })}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="resolution-custom">
              <input
                type="number"
                value={config.width}
                onChange={(e) => onUpdate({ width: +e.target.value || 1920 })}
                className="res-input"
              />
              <span className="res-separator">×</span>
              <input
                type="number"
                value={config.height}
                onChange={(e) => onUpdate({ height: +e.target.value || 1080 })}
                className="res-input"
              />
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">{t.fps}</span>
            <div className="fps-chips">
              {FPS_OPTIONS.map((f) => (
                <button
                  key={f}
                  className={`fps-chip ${config.fps === f ? 'active' : ''}`}
                  onClick={() => onUpdate({ fps: f })}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">{t.backgroundColor}</span>
            <div className="color-picker-row">
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="bg-color-input"
              />
              <input
                type="text"
                value={config.backgroundColor}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="hex-input"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">{t.totalDuration}</span>
            <div className="duration-input-row">
              <input
                type="number"
                min={1}
                max={600}
                step={1}
                value={videoDuration}
                onChange={(e) => onDurationChange(Math.max(1, Math.min(600, +e.target.value || 30)))}
                className="duration-input"
              />
              <span className="duration-unit">{t.seconds}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
