import { useState, useCallback, useEffect, useRef, type DragEvent } from 'react';
import { VideoPreview } from './components/VideoPreview';
import { OverlayManager } from './components/OverlayManager';
import { CanvasSettings } from './components/CanvasSettings';
import { ExportPanel } from './components/ExportPanel';
import { WelcomeModal } from './components/WelcomeModal';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { useFFmpeg } from './hooks/useFFmpeg';
import { translations, type Lang } from './i18n';
import type { MediaFile, OverlayItem } from './types';
import './App.css';

type Theme = 'dark' | 'light';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'dark', label: 'Oscuro' },
  { value: 'light', label: 'Claro' },
];

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
  { value: 'it', label: 'IT' },
];

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') return 'light';
    return 'dark';
  });
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'en');
  const [baseVideo] = useState<MediaFile | null>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [volume] = useState(1);
  const [videoDuration, setVideoDuration] = useState(30);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [canvasConfig, setCanvasConfig] = useState({
    width: 1920,
    height: 1080,
    fps: 30,
    backgroundColor: '#000000',
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const { load, loaded, loading, mergeVideoWithOverlay } = useFFmpeg();

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    if (!loaded && !loading) {
      load();
    }
  }, [loaded, loading, load]);

  const handleSelectTemplate = useCallback((config: { maxDuration: number; width: number; height: number; fps: number; backgroundColor: string }) => {
    setVideoDuration(config.maxDuration);
    setCanvasConfig({
      width: config.width,
      height: config.height,
      fps: config.fps,
      backgroundColor: config.backgroundColor,
    });
    setShowWelcome(false);
  }, []);

  const handleSelectCustom = useCallback((config: { maxDuration: number; width: number; height: number; fps: number; backgroundColor: string }) => {
    setVideoDuration(config.maxDuration);
    setCanvasConfig({
      width: config.width,
      height: config.height,
      fps: config.fps,
      backgroundColor: config.backgroundColor,
    });
    setShowWelcome(false);
  }, []);

  const handleCanvasConfigUpdate = useCallback((updates: Partial<typeof canvasConfig>) => {
    setCanvasConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleDurationChange = useCallback((duration: number) => {
    setVideoDuration(duration);
  }, []);

  const handleAddOverlay = useCallback((media: MediaFile) => {
    const newOverlay: OverlayItem = {
      id: crypto.randomUUID(),
      media,
      x: 50,
      y: 50,
      width: 320,
      height: 180,
      opacity: 1,
      startTime: 0,
      endTime: videoDuration,
      visible: true,
      locked: false,
    };
    setOverlays((prev) => [...prev, newOverlay]);
  }, [videoDuration]);

  const handleAddTextOverlay = useCallback((text: string, config: Partial<OverlayItem>) => {
    const newOverlay: OverlayItem = {
      id: crypto.randomUUID(),
      media: { file: null, url: '', type: 'text', name: 'Texto' },
      x: 100,
      y: 100,
      width: 0,
      height: 0,
      opacity: 1,
      startTime: 0,
      endTime: videoDuration,
      visible: true,
      locked: false,
      text,
      fontFamily: config.fontFamily || 'Arial',
      fontSize: config.fontSize || 48,
      fontColor: config.fontColor || '#FFFFFF',
      backgroundColor: config.backgroundColor || 'transparent',
      outlineColor: config.outlineColor || '#000000',
      outlineWidth: config.outlineWidth || 0,
    };
    setOverlays((prev) => [...prev, newOverlay]);
  }, [videoDuration]);

  const handleAddAudioOverlay = useCallback((media: MediaFile) => {
    const newOverlay: OverlayItem = {
      id: crypto.randomUUID(),
      media: { ...media, type: 'audio' },
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      opacity: 1,
      startTime: 0,
      endTime: videoDuration,
      visible: true,
      locked: false,
      audioVolume: 1,
    };
    setOverlays((prev) => [...prev, newOverlay]);
  }, [videoDuration]);

  const handleUpdateOverlay = useCallback((id: string, updates: Partial<OverlayItem>) => {
    setOverlays((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  }, []);

  const handleRemoveOverlay = useCallback((id: string) => {
    setOverlays((prev) => {
      const overlay = prev.find((o) => o.id === id);
      if (overlay && overlay.media.url) {
        URL.revokeObjectURL(overlay.media.url);
      }
      return prev.filter((o) => o.id !== id);
    });
  }, []);

  const handleMoveUp = useCallback((id: string) => {
    setOverlays((prev) => {
      const idx = prev.findIndex((o) => o.id === id);
      if (idx <= 0) return prev;
      const newOverlays = [...prev];
      [newOverlays[idx - 1], newOverlays[idx]] = [newOverlays[idx], newOverlays[idx - 1]];
      return newOverlays;
    });
  }, []);

  const handleMoveDown = useCallback((id: string) => {
    setOverlays((prev) => {
      const idx = prev.findIndex((o) => o.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const newOverlays = [...prev];
      [newOverlays[idx], newOverlays[idx + 1]] = [newOverlays[idx + 1], newOverlays[idx]];
      return newOverlays;
    });
  }, []);

  const handleExport = useCallback(async () => {
    if (!loaded) return;
    setIsExporting(true);
    setExportProgress(0);
    setResultBlob(null);

    try {
      const overlayData = overlays
        .filter((o) => o.visible)
        .map((o) => ({
          file: o.media.file,
          type: o.media.type,
          x: o.x,
          y: o.y,
          width: o.width,
          height: o.height,
          startTime: o.startTime,
          endTime: o.endTime,
          text: o.text,
          fontFamily: o.fontFamily,
          fontSize: o.fontSize,
          fontColor: o.fontColor,
          backgroundColor: o.backgroundColor,
          outlineColor: o.outlineColor,
          outlineWidth: o.outlineWidth,
          audioVolume: o.audioVolume,
          fadeInDuration: o.fadeInDuration,
          fadeOutDuration: o.fadeOutDuration,
          zoomInDuration: o.zoomInDuration,
          zoomOutDuration: o.zoomOutDuration,
          zoomInScale: o.zoomInScale,
          zoomOutScale: o.zoomOutScale,
        }));

      let videoFile = baseVideo?.file;

      if (!videoFile) {
        const videoOverlay = overlays.find(o => o.visible && o.media.type === 'video' && o.media.file);
        if (videoOverlay?.media.file) {
          videoFile = videoOverlay.media.file;
        }
      }

      if (videoFile) {
        const blob = await mergeVideoWithOverlay(
          videoFile,
          overlayData,
          setExportProgress,
          {
            width: canvasConfig.width,
            height: canvasConfig.height,
            backgroundColor: canvasConfig.backgroundColor,
          }
        );
        setResultBlob(blob);
      } else {
        console.log('No video to render. Add a video overlay or base video.');
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [baseVideo, loaded, overlays, canvasConfig, mergeVideoWithOverlay]);

  const handleDownload = useCallback(() => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edited_${baseVideo?.name || 'video'}.mp4`;
    a.click();
    URL.revokeObjectURL(url);
  }, [resultBlob, baseVideo]);

  const cycleTheme = () => {
    const idx = THEMES.findIndex((th) => th.value === theme);
    setTheme(THEMES[(idx + 1) % THEMES.length].value);
  };

  const cycleLang = () => {
    const idx = LANGS.findIndex((l) => l.value === lang);
    setLang(LANGS[(idx + 1) % LANGS.length].value);
  };

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    for (const file of files) {
      let type: MediaFile['type'];
      if (file.type.startsWith('video')) type = 'video';
      else if (file.type.startsWith('image')) type = 'image';
      else if (file.type.startsWith('audio')) type = 'audio';
      else continue;

      const media: MediaFile = {
        file,
        url: URL.createObjectURL(file),
        type,
        name: file.name,
      };

      if (type === 'audio') {
        handleAddAudioOverlay(media);
      } else {
        handleAddOverlay(media);
      }
    }
  }, [handleAddOverlay, handleAddAudioOverlay]);

  return (
    <>
      {showWelcome && (
        <WelcomeModal
          lang={lang}
          onSelectTemplate={handleSelectTemplate}
          onSelectCustom={handleSelectCustom}
        />
      )}
      <div
        className="app"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <header className="app-header">
          <div className="logo">
            <span className="logo-mark">[v]</span>
            <h1>larEditor</h1>
            <span className="version-badge">v1.0.0</span>
          </div>
          <div className="header-actions">
            <button className="btn-header" onClick={cycleTheme} title={t.theme}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span className="btn-label">{THEMES.find((th) => th.value === theme)?.label}</span>
            </button>
            <button className="btn-header" onClick={cycleLang} title={t.language}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="btn-label">{LANGS.find((l) => l.value === lang)?.label}</span>
            </button>
            <a className="btn-header btn-social" href="https://www.instagram.com/larevalot_/" target="_blank" rel="noopener noreferrer" title="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a className="btn-header btn-social" href="https://discord.gg/ab2XNv7qYA" target="_blank" rel="noopener noreferrer" title="Discord">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
            <a className="btn-header btn-studio" href="https://studio-larevalot.vercel.app/" target="_blank" rel="noopener noreferrer" title="Studio">
              <span className="btn-label">[studio]</span>
            </a>
          </div>
        </header>

        <main className="app-main">
          <aside className="left-panel">
            <ExportPanel
              canExport={loaded && (overlays.some(o => o.visible) || !!baseVideo)}
              isExporting={isExporting}
              progress={exportProgress}
              onExport={handleExport}
              onDownload={handleDownload}
              hasResult={!!resultBlob}
              t={t}
            />
            <div className="ad-box">
              <span className="ad-placeholder">{t.advertising}</span>
            </div>
            <button className="btn-privacy" onClick={() => setShowPrivacy(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              {t.privacyPolicy}
            </button>
          </aside>

          <section className="preview-section">
            <VideoPreview
              videoUrl={baseVideo?.url || null}
              overlays={overlays}
              volume={volume}
              canvasConfig={canvasConfig}
              videoDuration={videoDuration}
              onOverlayUpdate={handleUpdateOverlay}
              onDurationChange={handleDurationChange}
              t={t}
            />
            {isDragging && (
              <div className="drop-zone-overlay">
                <div className="drop-zone-content">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="drop-zone-text">{t.dropHere}</span>
                  <span className="drop-zone-hint">{t.dropHereHint}</span>
                </div>
              </div>
            )}
          </section>

          <aside className="sidebar">
            <div className="sidebar-section">
              <CanvasSettings
                config={canvasConfig}
                onUpdate={handleCanvasConfigUpdate}
                videoDuration={videoDuration}
                onDurationChange={handleDurationChange}
                t={t}
              />
            </div>

            <div className="sidebar-section">
              <OverlayManager
                overlays={overlays}
                onAdd={handleAddOverlay}
                onAddText={handleAddTextOverlay}
                onAddAudio={handleAddAudioOverlay}
                onUpdate={handleUpdateOverlay}
                onRemove={handleRemoveOverlay}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                t={t}
              />
            </div>
          </aside>
        </main>
      </div>
      {showPrivacy && (
        <PrivacyPolicy
          lang={lang}
          onClose={() => setShowPrivacy(false)}
        />
      )}
    </>
  );
}

export default App;
