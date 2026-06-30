import { useRef, useEffect, useState, useCallback } from 'react';
import { Timeline } from './Timeline';
import type { OverlayItem } from '../types';

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
  videoUrl: string | null;
  overlays: OverlayItem[];
  volume: number;
  canvasConfig: CanvasConfig;
  videoDuration?: number;
  onOverlayUpdate?: (id: string, updates: Partial<OverlayItem>) => void;
  onDurationChange?: (duration: number) => void;
  t?: Translations;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

export function VideoPreview({ videoUrl, overlays, volume, canvasConfig, videoDuration = 30, onOverlayUpdate, onDurationChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const overlayVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ id: string; handle: ResizeHandle; startX: number; startY: number; startW: number; startH: number; startXPos: number; startYPos: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      overlayVideosRef.current.forEach((vid) => {
        vid.pause();
      });
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

  const drawOverlays = useCallback((ctx: CanvasRenderingContext2D, time: number) => {
    overlays.forEach((overlay) => {
      if (!overlay.visible) return;
      if (time < overlay.startTime || time > overlay.endTime) return;

      let currentOpacity = overlay.opacity;
      const fadeInDur = overlay.fadeInDuration ?? 0;
      const fadeOutDur = overlay.fadeOutDuration ?? 0;

      if (fadeInDur > 0 && time < overlay.startTime + fadeInDur) {
        const progress = (time - overlay.startTime) / fadeInDur;
        currentOpacity = overlay.opacity * Math.min(1, Math.max(0, progress));
      } else if (fadeOutDur > 0 && time > overlay.endTime - fadeOutDur) {
        const progress = (overlay.endTime - time) / fadeOutDur;
        currentOpacity = overlay.opacity * Math.min(1, Math.max(0, progress));
      }

      ctx.globalAlpha = currentOpacity;

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
          document.body.appendChild(img);
        }
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, overlay.x, overlay.y, overlay.width, overlay.height);
        }
      } else if (overlay.media.type === 'video') {
        let vid = overlayVideosRef.current.get(overlay.id);
        if (!vid) {
          vid = document.createElement('video');
          vid.id = `ov-vid-${overlay.id}`;
          vid.src = overlay.media.url;
          vid.muted = false;
          vid.loop = false;
          vid.preload = 'auto';
          vid.style.position = 'absolute';
          vid.style.left = '-9999px';
          document.body.appendChild(vid);
          overlayVideosRef.current.set(overlay.id, vid);
        }

        vid.volume = overlay.audioVolume ?? 1;

        const overlayTime = time - overlay.startTime;
        if (overlayTime >= 0 && vid.duration > 0) {
          const clampedTime = overlayTime % vid.duration;
          if (Math.abs(vid.currentTime - clampedTime) > 0.3) {
            vid.currentTime = clampedTime;
          }
          if (isPlaying && vid.paused) {
            vid.play().catch(() => {});
          } else if (!isPlaying && !vid.paused) {
            vid.pause();
          }
        }

        if (vid.readyState >= 2) {
          ctx.drawImage(vid, overlay.x, overlay.y, overlay.width, overlay.height);
        }
      }

      ctx.globalAlpha = 1;
    });
  }, [overlays, isPlaying]);

  const drawSelectionIndicators = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!selectedId) return;
    const overlay = overlays.find(o => o.id === selectedId);
    if (!overlay || !overlay.visible) return;

    const x = overlay.x;
    const y = overlay.y;
    const w = overlay.width || 100;
    const h = overlay.height || 50;
    const dotSize = 6;

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);

    const dots = [
      { x: x, y: y },
      { x: x + w, y: y },
      { x: x, y: y + h },
      { x: x + w, y: y + h },
      { x: x + w / 2, y: y },
      { x: x + w / 2, y: y + h },
      { x: x, y: y + h / 2 },
      { x: x + w, y: y + h / 2 },
    ];

    dots.forEach(dot => {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    ctx.restore();
  }, [overlays, selectedId]);

  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvasConfig.width;
    canvas.height = canvasConfig.height;

    if (!videoUrl) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const startTime = performance.now() - (currentTimeRef.current * 1000);

      const drawFrame = () => {
        ctx.fillStyle = canvasConfig.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const elapsed = (performance.now() - startTime) / 1000;
        const time = isPlayingRef.current ? elapsed % videoDuration : currentTimeRef.current;
        drawOverlays(ctx, time);
        drawSelectionIndicators(ctx);

        if (isPlayingRef.current) {
          setCurrentTime(time);
          currentTimeRef.current = time;
        }
        animRef.current = requestAnimationFrame(drawFrame);
      };

      animRef.current = requestAnimationFrame(drawFrame);

      return () => {
        cancelAnimationFrame(animRef.current);
      };
    }

    if (!video || !videoReady) return;

    const drawFrame = () => {
      if (video.readyState < 2) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = canvasConfig.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const time = video.currentTime;
      drawOverlays(ctx, time);
      drawSelectionIndicators(ctx);
    };

    const onSeeked = () => {
      overlayVideosRef.current.forEach((vid, id) => {
        const overlay = overlays.find(o => o.id === id);
        if (overlay && overlay.media.type === 'video') {
          const overlayTime = video.currentTime - overlay.startTime;
          if (overlayTime >= 0 && vid.duration > 0) {
            vid.currentTime = overlayTime % vid.duration;
          }
        }
      });
      drawFrame();
    };

    const onPlay = () => {
      overlayVideosRef.current.forEach((vid, id) => {
        const overlay = overlays.find(o => o.id === id);
        if (overlay && video.currentTime >= overlay.startTime && video.currentTime <= overlay.endTime) {
          vid.play().catch(() => {});
        }
      });
      const tick = () => {
        drawFrame();
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
    };

    const onPause = () => {
      overlayVideosRef.current.forEach((vid) => {
        vid.pause();
      });
      cancelAnimationFrame(animRef.current);
    };

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
  }, [videoUrl, videoReady, canvasConfig, drawOverlays, drawSelectionIndicators, overlays, videoDuration]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const overlayVideos = overlayVideosRef.current;
    return () => {
      overlayVideos.forEach((vid) => {
        vid.pause();
        vid.src = '';
      });
      overlayVideos.clear();
    };
  }, []);

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

  const getResizeHandle = (x: number, y: number, overlay: OverlayItem): ResizeHandle => {
    const handleSize = 25;
    const o = overlay;
    const w = o.width || 100;
    const h = o.height || 50;

    if (x >= o.x - handleSize && x <= o.x + handleSize && y >= o.y - handleSize && y <= o.y + handleSize) return 'nw';
    if (x >= o.x + w - handleSize && x <= o.x + w + handleSize && y >= o.y - handleSize && y <= o.y + handleSize) return 'ne';
    if (x >= o.x - handleSize && x <= o.x + handleSize && y >= o.y + h - handleSize && y <= o.y + h + handleSize) return 'sw';
    if (x >= o.x + w - handleSize && x <= o.x + w + handleSize && y >= o.y + h - handleSize && y <= o.y + h + handleSize) return 'se';
    if (x >= o.x + w / 2 - handleSize && x <= o.x + w / 2 + handleSize && y >= o.y - handleSize && y <= o.y + handleSize) return 'n';
    if (x >= o.x + w / 2 - handleSize && x <= o.x + w / 2 + handleSize && y >= o.y + h - handleSize && y <= o.y + h + handleSize) return 's';
    if (x >= o.x - handleSize && x <= o.x + handleSize && y >= o.y + h / 2 - handleSize && y <= o.y + h / 2 + handleSize) return 'w';
    if (x >= o.x + w - handleSize && x <= o.x + w + handleSize && y >= o.y + h / 2 - handleSize && y <= o.y + h / 2 + handleSize) return 'e';
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const time = videoUrl ? (videoRef.current?.currentTime || 0) : currentTime;

    for (let i = overlays.length - 1; i >= 0; i--) {
      const o = overlays[i];
      if (!o.visible) continue;
      if (o.locked) continue;
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

      const handle = getResizeHandle(x, y, { ...o, width: hitW, height: hitH });
      if (handle) {
        setSelectedId(o.id);
        setResizing({
          id: o.id,
          handle,
          startX: x,
          startY: y,
          startW: hitW,
          startH: hitH,
          startXPos: o.x,
          startYPos: o.y,
        });
        return;
      }

      if (x >= o.x && x <= o.x + hitW && y >= o.y && y <= o.y + hitH) {
        setSelectedId(o.id);
        setDragging({ id: o.id, offsetX: x - o.x, offsetY: y - o.y });
        return;
      }
    }
    setSelectedId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);

    if (resizing && onOverlayUpdate) {
      const dx = x - resizing.startX;
      const dy = y - resizing.startY;
      let newW = resizing.startW;
      let newH = resizing.startH;
      let newX = resizing.startXPos;
      let newY = resizing.startYPos;

      switch (resizing.handle) {
        case 'se':
          newW = Math.max(20, resizing.startW + dx);
          newH = Math.max(20, resizing.startH + dy);
          break;
        case 'sw':
          newW = Math.max(20, resizing.startW - dx);
          newH = Math.max(20, resizing.startH + dy);
          newX = resizing.startXPos + dx;
          break;
        case 'ne':
          newW = Math.max(20, resizing.startW + dx);
          newH = Math.max(20, resizing.startH - dy);
          newY = resizing.startYPos + dy;
          break;
        case 'nw':
          newW = Math.max(20, resizing.startW - dx);
          newH = Math.max(20, resizing.startH - dy);
          newX = resizing.startXPos + dx;
          newY = resizing.startYPos + dy;
          break;
        case 'n':
          newH = Math.max(20, resizing.startH - dy);
          newY = resizing.startYPos + dy;
          break;
        case 's':
          newH = Math.max(20, resizing.startH + dy);
          break;
        case 'e':
          newW = Math.max(20, resizing.startW + dx);
          break;
        case 'w':
          newW = Math.max(20, resizing.startW - dx);
          newX = resizing.startXPos + dx;
          break;
      }

      onOverlayUpdate(resizing.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
      });
      return;
    }

    if (dragging && onOverlayUpdate) {
      onOverlayUpdate(dragging.id, {
        x: Math.round(x - dragging.offsetX),
        y: Math.round(y - dragging.offsetY),
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
  };

  return (
    <div className="preview-container" ref={containerRef}>
      <video
        ref={videoRef}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        preload="auto"
        playsInline
      />
      <div className="preview-canvas-wrapper">
        <div
          className="preview-canvas-ratio"
          style={{ aspectRatio: `${canvasConfig.width} / ${canvasConfig.height}` }}
        >
          <canvas
            ref={canvasRef}
            className="preview-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
      <Timeline
        duration={duration || videoDuration}
        currentTime={currentTime}
        overlays={overlays}
        isPlaying={isPlaying}
        onSeek={(time) => {
          const video = videoRef.current;
          if (video && videoUrl) {
            video.currentTime = time;
            setCurrentTime(time);
          }
        }}
        onTogglePlay={() => {
          const video = videoRef.current;
          if (!videoUrl || !video || !videoReady) {
            setIsPlaying(!isPlaying);
            return;
          }
          if (isPlaying) {
            video.pause();
            overlayVideosRef.current.forEach((vid) => {
              vid.pause();
            });
          } else {
            video.play().catch(() => {});
            const time = video.currentTime;
            overlayVideosRef.current.forEach((vid, id) => {
              const overlay = overlays.find(o => o.id === id);
              if (overlay && overlay.media.type === 'video' && time >= overlay.startTime && time <= overlay.endTime) {
                vid.play().catch(() => {});
              }
            });
          }
          setIsPlaying(!isPlaying);
        }}
        onOverlayUpdate={onOverlayUpdate || (() => {})}
      />
    </div>
  );
}
