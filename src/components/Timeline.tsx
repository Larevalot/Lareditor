import { useRef, useState, useCallback } from 'react';
import type { OverlayItem } from '../types';

interface Props {
  duration: number;
  currentTime: number;
  overlays: OverlayItem[];
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onOverlayUpdate: (id: string, updates: Partial<OverlayItem>) => void;
}

export function Timeline({ duration, currentTime, overlays, isPlaying, onSeek, onTogglePlay, onOverlayUpdate }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; edge: 'start' | 'end' } | null>(null);

  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getTimeFromPosition = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || duration <= 0) return 0;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  }, [duration]);

  const handleTrackClick = (e: React.MouseEvent) => {
    const time = getTimeFromPosition(e.clientX);
    onSeek(time);
  };

  const handleOverlayMouseDown = (e: React.MouseEvent, id: string, edge: 'start' | 'end') => {
    e.stopPropagation();
    setDragging({ id, edge });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const time = getTimeFromPosition(e.clientX);
    const overlay = overlays.find(o => o.id === dragging.id);
    if (!overlay) return;

    if (dragging.edge === 'start') {
      const newStart = Math.max(0, Math.min(time, overlay.endTime - 0.1));
      onOverlayUpdate(dragging.id, { startTime: Math.round(newStart * 10) / 10 });
    } else {
      const newEnd = Math.max(overlay.startTime + 0.1, Math.min(time, duration));
      onOverlayUpdate(dragging.id, { endTime: Math.round(newEnd * 10) / 10 });
    }
  }, [dragging, overlays, duration, getTimeFromPosition, onOverlayUpdate]);

  const handleMouseUp = () => {
    setDragging(null);
  };

  const getOverlayColor = (type: string) => {
    switch (type) {
      case 'video': return 'var(--olive)';
      case 'image': return '#5B9BD5';
      case 'text': return '#E8A838';
      case 'audio': return '#9B59B6';
      default: return 'var(--olive)';
    }
  };

  const getOverlayLabel = (overlay: OverlayItem) => {
    if (overlay.media.type === 'text') return overlay.text || 'TXT';
    return overlay.media.name;
  };

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <button className="btn-play" onClick={onTogglePlay}>
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
        <span className="timeline-current">{formatTime(currentTime)}</span>
        <span className="timeline-duration">{formatTime(duration)}</span>
      </div>

      <div className="timeline-layers-scroll">
        <div
          className="timeline-track"
          ref={trackRef}
          onClick={handleTrackClick}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="timeline-progress" style={{ width: `${pct}%` }} />
          <div className="timeline-playhead" style={{ left: `${pct}%` }} />

          {overlays.map((overlay) => {
            const left = (overlay.startTime / duration) * 100;
            const width = ((overlay.endTime - overlay.startTime) / duration) * 100;
            const color = overlay.timelineColor || getOverlayColor(overlay.media.type);

            return (
              <div
                key={overlay.id}
                className="timeline-layer-row"
              >
                <div
                  className="timeline-overlay"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`,
                    backgroundColor: color,
                    opacity: overlay.visible ? 0.8 : 0.3,
                  }}
                  title={`${getOverlayLabel(overlay)} (${formatTime(overlay.startTime)} - ${formatTime(overlay.endTime)})`}
                >
                  <div
                    className="timeline-handle timeline-handle-start"
                    onMouseDown={(e) => handleOverlayMouseDown(e, overlay.id, 'start')}
                  />
                  <span className="timeline-overlay-label">{getOverlayLabel(overlay)}</span>
                  <div
                    className="timeline-handle timeline-handle-end"
                    onMouseDown={(e) => handleOverlayMouseDown(e, overlay.id, 'end')}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="timeline-ticks">
        {Array.from({ length: Math.min(10, Math.ceil(duration)) }, (_, i) => {
          const time = (i / 10) * duration;
          return (
            <span
              key={i}
              className="timeline-tick"
              style={{ left: `${(time / duration) * 100}%` }}
            >
              {formatTime(time)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
