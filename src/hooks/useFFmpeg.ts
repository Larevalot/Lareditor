import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export interface OverlayData {
  file: File | null;
  type: 'image' | 'video' | 'text';
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
    audioFile: File | null,
    audioEnabled: boolean,
    onProgress?: (progress: number) => void
  ): Promise<Blob> => {
    if (!ffmpegRef.current) throw new Error('FFmpeg not loaded');
    const ffmpeg = ffmpegRef.current;

    const progressHandler = ({ progress }: { progress: number }) => {
      onProgress?.(Math.min(99, Math.round(progress * 100)));
    };
    ffmpeg.on('progress', progressHandler);

    const overlayFiles: string[] = [];
    let audioFileName = '';

    try {
      const baseData = new Uint8Array(await baseVideo.arrayBuffer());
      await ffmpeg.writeFile('base.mp4', baseData);

      const inputArgs: string[] = ['-i', 'base.mp4'];
      let inputIdx = 1;

      const processedOverlays: ProcessedOverlay[] = [];

      for (const ov of overlays) {
        if (ov.type === 'text') {
          const { data, width, height } = await renderTextToPng(ov);
          processedOverlays.push({
            data,
            type: 'image',
            x: ov.x,
            y: ov.y,
            width,
            height,
            startTime: ov.startTime,
            endTime: ov.endTime,
          });
        } else if (ov.file) {
          const data = new Uint8Array(await ov.file.arrayBuffer());
          processedOverlays.push({
            data,
            type: ov.type as 'image' | 'video',
            x: ov.x,
            y: ov.y,
            width: ov.width,
            height: ov.height,
            startTime: ov.startTime,
            endTime: ov.endTime,
          });
        }
      }

      for (const ov of processedOverlays) {
        const ext = ov.type === 'image' ? 'png' : 'mp4';
        const fname = `ov${inputIdx}.${ext}`;
        await ffmpeg.writeFile(fname, ov.data);
        inputArgs.push('-i', fname);
        overlayFiles.push(fname);
        inputIdx++;
      }

      if (audioFile && audioEnabled) {
        const audioData = new Uint8Array(await audioFile.arrayBuffer());
        const ext = audioFile.name.split('.').pop() || 'mp3';
        audioFileName = `audio.${ext}`;
        await ffmpeg.writeFile(audioFileName, audioData);
        inputArgs.push('-i', audioFileName);
      }

      const args = [...inputArgs];

      if (processedOverlays.length > 0) {
        const filter = buildFilter(processedOverlays);
        args.push('-filter_complex', filter);
        args.push('-map', '[vout]');
      }

      if (audioFile && audioEnabled) {
        const audioIdx = inputIdx;
        args.push('-map', `${audioIdx}:a`);
        args.push('-shortest');
      } else if (!audioEnabled) {
        args.push('-an');
      } else {
        args.push('-map', '0:a?');
      }

      args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-c:a', 'aac', '-y', 'out.mp4');

      console.log('[FFmpeg] exec args:', args.join(' '));
      await ffmpeg.exec(args);
      const result = await ffmpeg.readFile('out.mp4');

      onProgress?.(100);
      return new Blob([result as unknown as BlobPart], { type: 'video/mp4' });
    } finally {
      await safeDelete(ffmpeg, 'base.mp4');
      for (const f of overlayFiles) await safeDelete(ffmpeg, f);
      if (audioFileName) await safeDelete(ffmpeg, audioFileName);
      await safeDelete(ffmpeg, 'out.mp4');
      ffmpeg.off('progress', progressHandler);
    }
  }, []);

  return { load, loaded, loading, error, removeAudio, mergeVideoWithOverlay };
}

function buildFilter(overlays: ProcessedOverlay[]): string {
  const parts: string[] = [];
  let prev = '0:v';

  for (let i = 0; i < overlays.length; i++) {
    const ov = overlays[i];
    const idx = i + 1;
    const isLast = i === overlays.length - 1;
    const outLabel = isLast ? 'vout' : `t${idx}`;
    const enable = `between(t\\,${ov.startTime}\\,${ov.endTime})`;

    parts.push(`[${idx}:v]scale=${ov.width}:${ov.height},setsar=1[ol${idx}]`);
    if (ov.type === 'image') {
      parts.push(`[${prev}][ol${idx}]overlay=${ov.x}:${ov.y}:enable='${enable}'[${outLabel}]`);
    } else {
      parts.push(`[${prev}][ol${idx}]overlay=${ov.x}:${ov.y}:enable='${enable}':shortest=1[${outLabel}]`);
    }
    prev = outLabel;
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

async function safeDelete(ffmpeg: FFmpeg, name: string) {
  try { await ffmpeg.deleteFile(name); } catch { /* ignore */ }
}
