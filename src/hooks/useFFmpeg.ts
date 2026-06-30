import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export interface OverlayData {
  file: File | null;
  type: 'image' | 'video' | 'text' | 'audio';
  x: number;
  y: number;
  width: number;
  height: number;
  startTime: number;
  endTime: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  audioVolume?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
}

interface ProcessedOverlay {
  data: Uint8Array;
  type: 'image' | 'video';
  x: number;
  y: number;
  width: number;
  height: number;
  startTime: number;
  endTime: number;
  fadeInDuration: number;
  fadeOutDuration: number;
  audioVolume?: number;
}

interface ProcessedAudio {
  data: Uint8Array;
  ext: string;
  startTime: number;
  endTime: number;
  volume: number;
  inputIdx?: number;
}

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (loaded || loading) return;
    setLoading(true);
    setError(null);
    try {
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      setLoaded(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to load FFmpeg:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [loaded, loading]);

  const removeAudio = useCallback(async (videoFile: File): Promise<Blob> => {
    if (!ffmpegRef.current) throw new Error('FFmpeg not loaded');
    const ffmpeg = ffmpegRef.current;

    const inputData = new Uint8Array(await videoFile.arrayBuffer());
    await ffmpeg.writeFile('input.mp4', inputData);
    await ffmpeg.exec(['-i', 'input.mp4', '-an', '-c:v', 'copy', 'output.mp4']);
    const data = await ffmpeg.readFile('output.mp4');
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.mp4');

    return new Blob([data as unknown as BlobPart], { type: 'video/mp4' });
  }, []);

  const mergeVideoWithOverlay = useCallback(async (
    baseVideo: File,
    overlays: OverlayData[],
    onProgress?: (progress: number) => void,
    canvasConfig?: CanvasConfig
  ): Promise<Blob> => {
    if (!ffmpegRef.current) throw new Error('FFmpeg not loaded');
    const ffmpeg = ffmpegRef.current;

    const progressHandler = ({ progress }: { progress: number }) => {
      onProgress?.(Math.min(99, Math.round(progress * 100)));
    };
    ffmpeg.on('progress', progressHandler);

    const writtenFiles: string[] = [];

    try {
      const baseData = new Uint8Array(await baseVideo.arrayBuffer());
      await ffmpeg.writeFile('base.mp4', baseData);
      writtenFiles.push('base.mp4');

      const duration = await getVideoDuration(baseVideo);

      const outputWidth = canvasConfig?.width || 1920;
      const outputHeight = canvasConfig?.height || 1080;
      const bgColor = canvasConfig?.backgroundColor || '#000000';

      const inputArgs: string[] = ['-i', 'base.mp4'];
      let inputIdx = 1;

      const visualOverlays: ProcessedOverlay[] = [];
      const audioOverlays: ProcessedAudio[] = [];

      for (const ov of overlays) {
        if (ov.type === 'audio' && ov.file) {
          const data = new Uint8Array(await ov.file.arrayBuffer());
          const ext = ov.file.name.split('.').pop() || 'mp3';
          audioOverlays.push({
            data,
            ext,
            startTime: ov.startTime,
            endTime: ov.endTime,
            volume: ov.audioVolume ?? 1,
          });
        } else if (ov.type === 'text') {
          const { data, width, height } = await renderTextToPng(ov);
          visualOverlays.push({
            data,
            type: 'image',
            x: ov.x,
            y: ov.y,
            width,
            height,
            startTime: ov.startTime,
            endTime: ov.endTime,
            fadeInDuration: ov.fadeInDuration ?? 0,
            fadeOutDuration: ov.fadeOutDuration ?? 0,
          });
        } else if (ov.file) {
          const data = new Uint8Array(await ov.file.arrayBuffer());
          visualOverlays.push({
            data,
            type: ov.type as 'image' | 'video',
            x: ov.x,
            y: ov.y,
            width: ov.width,
            height: ov.height,
            startTime: ov.startTime,
            endTime: ov.endTime,
            fadeInDuration: ov.fadeInDuration ?? 0,
            fadeOutDuration: ov.fadeOutDuration ?? 0,
            audioVolume: ov.type === 'video' ? (ov.audioVolume ?? 1) : undefined,
          });
        }
      }

      for (const ov of visualOverlays) {
        const ext = ov.type === 'image' ? 'png' : 'mp4';
        const fname = `ov${inputIdx}.${ext}`;
        await ffmpeg.writeFile(fname, ov.data);
        inputArgs.push('-i', fname);
        writtenFiles.push(fname);
        inputIdx++;
      }

      for (const au of audioOverlays) {
        const fname = `au${inputIdx}.${au.ext}`;
        await ffmpeg.writeFile(fname, au.data);
        inputArgs.push('-i', fname);
        writtenFiles.push(fname);
        inputIdx++;
      }

      const args = [...inputArgs];

      const hasVisuals = visualOverlays.length > 0;
      const hasStandaloneAudio = audioOverlays.length > 0;
      const videoOverlaysWithAudio = visualOverlays.filter(ov => ov.type === 'video' && ov.audioVolume !== undefined && ov.audioVolume > 0);
      const hasVideoOverlayAudio = videoOverlaysWithAudio.length > 0;
      const hasAnyAudio = hasStandaloneAudio || hasVideoOverlayAudio;

      const hexToRgb = (hex: string) => {
        const h = hex.replace('#', '');
        return `0x${h}`;
      };

      if (hasVisuals) {
        const filter = buildVideoFilter(visualOverlays, outputWidth, outputHeight, hexToRgb(bgColor), duration);
        args.push('-filter_complex', filter);
        args.push('-map', '[vout]');
      } else {
        args.push('-filter_complex', `color=c=${hexToRgb(bgColor)}:s=${outputWidth}x${outputHeight}:d=${duration}[vout]`);
        args.push('-map', '[vout]');
      }

      if (hasAnyAudio) {
        const audioFilter = buildAudioFilter(audioOverlays, visualOverlays.length, videoOverlaysWithAudio, visualOverlays);
        const existingFilter = args[args.indexOf('-filter_complex') + 1] || '';
        args[args.indexOf('-filter_complex') + 1] = existingFilter + ';' + audioFilter;
        args.push('-map', '[aout]');
      } else {
        args.push('-map', '0:a?');
      }

      args.push('-shortest');

      args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'aac', '-y', 'out.mp4');

      console.log('[FFmpeg] exec args:', args.join(' '));
      await ffmpeg.exec(args);
      const result = await ffmpeg.readFile('out.mp4');

      onProgress?.(100);
      return new Blob([result as unknown as BlobPart], { type: 'video/mp4' });
    } finally {
      for (const f of writtenFiles) await safeDelete(ffmpeg, f);
      await safeDelete(ffmpeg, 'out.mp4');
      ffmpeg.off('progress', progressHandler);
    }
  }, []);

  return { load, loaded, loading, error, removeAudio, mergeVideoWithOverlay };
}

function buildVideoFilter(overlays: ProcessedOverlay[], outputWidth: number, outputHeight: number, bgColor: string, duration: number): string {
  const parts: string[] = [];
  
  parts.push(`color=c=${bgColor}:s=${outputWidth}x${outputHeight}:d=${duration}[bg]`);
  let prev = 'bg';

  for (let i = 0; i < overlays.length; i++) {
    const ov = overlays[i];
    const idx = i + 1;
    const isLast = i === overlays.length - 1;
    const outLabel = isLast ? 'vout' : `t${idx}`;
    const enable = `between(t\\,${ov.startTime}\\,${ov.endTime})`;

    let overlayInput = `[${idx}:v]scale=${ov.width}:${ov.height},setsar=1`;

    if (ov.fadeInDuration > 0) {
      overlayInput += `,fade=t=in:st=${ov.startTime}:d=${ov.fadeInDuration}:alpha=1`;
    }
    if (ov.fadeOutDuration > 0) {
      const fadeOutStart = ov.endTime - ov.fadeOutDuration;
      overlayInput += `,fade=t=out:st=${fadeOutStart}:d=${ov.fadeOutDuration}:alpha=1`;
    }

    overlayInput += `[ol${idx}]`;
    parts.push(overlayInput);

    parts.push(`[${prev}][ol${idx}]overlay=${ov.x}:${ov.y}:enable='${enable}'[${outLabel}]`);
    prev = outLabel;
  }

  return parts.join(';');
}

function buildAudioFilter(audios: ProcessedAudio[], visualCount: number, videoOverlays: ProcessedOverlay[], allVisuals: ProcessedOverlay[]): string {
  const parts: string[] = [];
  const audioInputs: string[] = [];

  parts.push(`[0:a]acopy[base_a]`);
  audioInputs.push(`[base_a]`);

  for (let i = 0; i < audios.length; i++) {
    const au = audios[i];
    const inputIdx = visualCount + i + 1;
    const label = `au${i}`;

    parts.push(`[${inputIdx}:a]volume=${au.volume},atrim=start=${au.startTime}:end=${au.endTime},asetpts=PTS-STARTPTS[${label}]`);
    audioInputs.push(`[${label}]`);
  }

  for (let i = 0; i < videoOverlays.length; i++) {
    const ov = videoOverlays[i];
    const visualIndex = allVisuals.indexOf(ov);
    if (visualIndex < 0) continue;
    const inputIdx = visualIndex + 1;
    const label = `vau${i}`;

    parts.push(`[${inputIdx}:a]volume=${ov.audioVolume ?? 1},atrim=start=${ov.startTime}:end=${ov.endTime},asetpts=PTS-STARTPTS[${label}]`);
    audioInputs.push(`[${label}]`);
  }

  if (audioInputs.length > 1) {
    parts.push(`${audioInputs.join('')}amix=inputs=${audioInputs.length}:duration=longest:normalize=0[aout]`);
  } else {
    parts.push(`[base_a]acopy[aout]`);
  }

  return parts.join(';');
}

async function renderTextToPng(overlay: OverlayData): Promise<{ data: Uint8Array; width: number; height: number }> {
  const fontSize = overlay.fontSize || 48;
  const font = overlay.fontFamily || 'Arial';
  const text = overlay.text || '';
  const lines = text.split('\n');
  const lineHeight = fontSize * 1.3;
  const padding = Math.ceil(fontSize * 0.3);

  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d')!;
  measureCtx.font = `${fontSize}px "${font}"`;

  let maxWidth = 0;
  for (const line of lines) {
    const w = measureCtx.measureText(line).width;
    if (w > maxWidth) maxWidth = w;
  }

  const width = Math.ceil(maxWidth) + padding * 2;
  const height = Math.ceil(lines.length * lineHeight) + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.font = `${fontSize}px "${font}"`;
  ctx.textBaseline = 'top';
  ctx.clearRect(0, 0, width, height);

  if (overlay.backgroundColor && overlay.backgroundColor !== 'transparent') {
    ctx.fillStyle = overlay.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = overlay.fontColor || '#FFFFFF';

  for (let i = 0; i < lines.length; i++) {
    const y = padding + i * lineHeight;
    if (overlay.outlineWidth && overlay.outlineWidth > 0) {
      ctx.strokeStyle = overlay.outlineColor || '#000000';
      ctx.lineWidth = overlay.outlineWidth * 2;
      ctx.lineJoin = 'round';
      ctx.strokeText(lines[i], padding, y);
    }
    ctx.fillText(lines[i], padding, y);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      blob!.arrayBuffer().then((buf) => {
        resolve({ data: new Uint8Array(buf), width, height });
      });
    }, 'image/png');
  });
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const d = video.duration;
      URL.revokeObjectURL(video.src);
      resolve(isFinite(d) && d > 0 ? d : 60);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(60);
    };
    video.src = URL.createObjectURL(file);
  });
}

async function safeDelete(ffmpeg: FFmpeg, name: string) {
  try { await ffmpeg.deleteFile(name); } catch { /* ignore */ }
}
