import { useState, useCallback, useEffect } from 'react';
import { VideoUploader } from './components/VideoUploader';
import { VideoPreview } from './components/VideoPreview';
import { OverlayManager } from './components/OverlayManager';
import { AudioControls } from './components/AudioControls';
import { ExportPanel } from './components/ExportPanel';
import { useFFmpeg } from './hooks/useFFmpeg';
import { translations, type Lang } from './i18n';
import type { MediaFile, OverlayItem } from './types';
import './App.css';

type Theme = 'green' | 'dark' | 'light';

const THEMES: { value: Theme; label: string }[] = [
  { value: 'green', label: 'Oliva' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'light', label: 'Claro' },
];

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
  { value: 'it', label: 'IT' },
];

function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'green');
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('lang') as Lang) || 'en');
  const [baseVideo, setBaseVideo] = useState<MediaFile | null>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [audioFile, setAudioFile] = useState<MediaFile | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const { load, loaded, loading, removeAudio, mergeVideoWithOverlay } = useFFmpeg();

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
      endTime: 30,
      visible: true,
    };
    setOverlays((prev) => [...prev, newOverlay]);
  }, []);

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
      endTime: 30,
      visible: true,
      text,
      fontFamily: config.fontFamily || 'Arial',
      fontSize: config.fontSize || 48,
      fontColor: config.fontColor || '#FFFFFF',
      backgroundColor: config.backgroundColor || 'transparent',
      outlineColor: config.outlineColor || '#000000',
      outlineWidth: config.outlineWidth || 0,
    };
    setOverlays((prev) => [...prev, newOverlay]);
  }, []);

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

  const handleRemoveAudioFromVideo = useCallback(async () => {
    if (!baseVideo || !loaded) return;
    try {
      const blob = await removeAudio(baseVideo.file!);
      const url = URL.createObjectURL(blob);
      const newFile = new File([blob], baseVideo.name, { type: 'video/mp4' });
      if (baseVideo.url) URL.revokeObjectURL(baseVideo.url);
      setBaseVideo({ file: newFile, url, type: 'video', name: baseVideo.name });
    } catch (err) {
      console.error('Error removing audio:', err);
    }
  }, [baseVideo, loaded, removeAudio]);

  const handleExport = useCallback(async () => {
    if (!baseVideo || !loaded) return;
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
        }));

      const blob = await mergeVideoWithOverlay(
        baseVideo.file!,
        overlayData,
        audioFile?.file || null,
        audioEnabled,
        setExportProgress
      );
      setResultBlob(blob);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  }, [baseVideo, loaded, overlays, audioFile, audioEnabled, mergeVideoWithOverlay]);

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <h1>LarEditor</h1>
          <span className="ready-badge">{t.ready}</span>
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
            {THEMES.find((th) => th.value === theme)?.label}
          </button>
          <button className="btn-header" onClick={cycleLang} title={t.language}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {LANGS.find((l) => l.value === lang)?.label}
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
        </div>
      </header>

      <main className="app-main">
        <aside className="left-panel">
          <ExportPanel
            canExport={!!baseVideo && loaded}
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
        </aside>

        <section className="preview-section">
          <VideoPreview
            videoUrl={baseVideo?.url || null}
            overlays={overlays}
            audioEnabled={audioEnabled}
            onOverlayUpdate={handleUpdateOverlay}
            t={t}
          />
          {!baseVideo && (
            <VideoUploader
              label={t.dragVideo}
              accept="video/*"
              onFileSelect={setBaseVideo}
            />
          )}
        </section>

        <aside className="sidebar">
          {baseVideo && (
            <div className="sidebar-section">
              <VideoUploader
                label={t.changeBaseVideo}
                accept="video/*"
                onFileSelect={setBaseVideo}
                currentFile={baseVideo}
                compact
              />
            </div>
          )}

          <div className="sidebar-section">
            <OverlayManager
              overlays={overlays}
              onAdd={handleAddOverlay}
              onAddText={handleAddTextOverlay}
              onUpdate={handleUpdateOverlay}
              onRemove={handleRemoveOverlay}
              t={t}
            />
          </div>

          <div className="sidebar-section">
            <AudioControls
              audioEnabled={audioEnabled}
              audioFile={audioFile}
              onToggle={() => setAudioEnabled(!audioEnabled)}
              onFileSelect={setAudioFile}
              onRemoveAudio={handleRemoveAudioFromVideo}
              t={t}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
