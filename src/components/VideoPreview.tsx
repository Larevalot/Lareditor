import { useRef, useEffect, useState } from 'react';
import type { OverlayItem } from '../types';

interface Translations {
  [key: string]: string;
}

interface Props {
  videoUrl: string | null;
  overlays: OverlayItem[];
  volume: number;
  onOverlayUpdate?: (id: string, updates: Partial<OverlayItem>) => void;
  onDurationChange?: (duration: number) => void;
  t: Translations;
}

export function VideoPreview({ videoUrl, overlays, volume, onOverlayUpdate, onDurationChange, t }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const drawFrameRef = useRef<() => void>(() => {});
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    setVideoReady(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    cancelAnimationFrame(animRef.current);

    const onLoaded = () => {
      setDuration(video.duration);
      setVideoReady(true);
      onDurationChange?.(video.duration);
    };

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animRef.current);
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('loadeddata', onLoaded);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    video.src = videoUrl;
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('loadeddata', onLoaded);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      cancelAnimationFrame(animRef.current);
    };
  }, [videoUrl, onDurationChange]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !videoReady) return;

    const drawFrame = () => {
      if (video.readyState < 2) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 360;
      if (canvas.width !== vw) canvas.width = vw;
      if (canvas.height !== vh) canvas.height = vh;

      ctx.clearRect(0, 0, vw, vh);
      ctx.drawImage(video, 0, 0, vw, vh);

      const time = video.currentTime;

      overlays.forEach((overlay) => {
        if (!overlay.visible) return;
        if (time < overlay.startTime || time > overlay.endTime) return;

        ctx.globalAlpha = overlay.opacity;

        if (overlay.media.type === 'text') {
          const fontSize = overlay.fontSize || 48;
          const font = overlay.fontFamily || 'Arial';
          ctx.font = `${fontSize}px "${font}"`;
          ctx.textBaseline = 'top';

          const text = overlay.text || '';
          const lines = text.split('\n');
          const lineHeight = fontSize * 1.2;

          if (overlay.backgroundColor && overlay.backgroundColor !== 'transparent') {
            let maxWidth = 0;
            for (const line of lines) {
              const w = ctx.measureText(line).width;
              if (w > maxWidth) maxWidth = w;
            }
            ctx.fillStyle = overlay.backgroundColor;
            ctx.fillRect(overlay.x - 4, overlay.y - 4, maxWidth + 8, lines.length * lineHeight + 8);
          }

          ctx.fillStyle = overlay.fontColor || '#FFFFFF';
          lines.forEach((line, i) => {
            const y = overlay.y + i * lineHeight;
            if (overlay.outlineWidth && overlay.outlineWidth > 0) {
              ctx.strokeStyle = overlay.outlineColor || '#000000';
              ctx.lineWidth = overlay.outlineWidth * 2;
              ctx.lineJoin = 'round';
              ctx.strokeText(line, overlay.x, y);
            }
            ctx.fillText(line, overlay.x, y);
          });
        } else if (overlay.media.type === 'image') {
          const existing = document.getElementById(`ov-img-${overlay.id}`) as HTMLImageElement | null;
          let img = existing;
          if (!img) {
            img = new Image();
            img.id = `ov-img-${overlay.id}`;
            img.src = overlay.media.url;
            img.style.position = 'absolute';
            img.style.left = '-9999px';
            img.onload = () => drawFrameRef.current?.();
            document.body.appendChild(img);
          }
          if (img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, overlay.x, overlay.y, overlay.width, overlay.height);
          }
        } else {
          const existing = document.getElementById(`ov-vid-${overlay.id}`) as HTMLVideoElement | null;
          let vid = existing;
          if (!vid) {
            vid = document.createElement('video');
            vid.id = `ov-vid-${overlay.id}`;
            vid.src = overlay.media.url;
            vid.muted = true;
            vid.loop = true;
            vid.style.position = 'absolute';
            vid.style.left = '-9999px';
            document.body.appendChild(vid);
            vid.play().catch(() => {});
          }
          ctx.drawImage(vid, overlay.x, overlay.y, overlay.width, overlay.height);
        }

        ctx.globalAlpha = 1;
      });
    };

    drawFrameRef.current = drawFrame;

    const onSeeked = () => drawFrame();
    const onPlay = () => {
      const tick = () => {
        drawFrame();
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    };
    const onPause = () => cancelAnimationFrame(animRef.current);

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);

    drawFrame();

    return () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      cancelAnimationFrame(animRef.current);
    };
  }, [videoReady, overlays, isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !videoReady) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (s: number) => {
    if (!isFinite(s) || s < 0) return '0:00';
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const time = videoRef.current?.currentTime || 0;

    for (let i = overlays.length - 1; i >= 0; i--) {
      const o = overlays[i];
      if (!o.visible) continue;
      if (time < o.startTime || time > o.endTime) continue;

      let hitW = o.width;
      let hitH = o.height;
      if (o.media.type === 'text') {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const fontSize = o.fontSize || 48;
            const font = o.fontFamily || 'Arial';
            ctx.font = `${fontSize}px "${font}"`;
            const lines = (o.text || '').split('\n');
            hitW = Math.max(...lines.map((l) => ctx.measureText(l).width));
            hitH = lines.length * fontSize * 1.2;
          }
        }
      }

      if (x >= o.x && x <= o.x + hitW && y >= o.y && y <= o.y + hitH) {
        setDragging({ id: o.id, offsetX: x - o.x, offsetY: y - o.y });
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !onOverlayUpdate) return;
    const { x, y } = getCanvasCoords(e);
    onOverlayUpdate(dragging.id, {
      x: Math.max(0, Math.round(x - dragging.offsetX)),
      y: Math.max(0, Math.round(y - dragging.offsetY)),
    });
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  if (!videoUrl) {
    return (
      <div className="preview-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>{t.uploadVideo}</span>
      </div>
    );
  }

  return (
    <div className="preview-container">
      <video
        ref={videoRef}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        preload="auto"
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="preview-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragging ? 'grabbing' : 'default' }}
      />
      <div className="preview-controls">
        <button className="btn-play" onClick={togglePlay} disabled={!videoReady}>
          {isPlaying ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </button>
        <span className="time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="seek-bar"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          disabled={!videoReady}
        />
        <span className="time">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
