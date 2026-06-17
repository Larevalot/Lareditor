import { VideoUploader } from './VideoUploader';
import type { MediaFile } from '../types';

interface Translations {
  [key: string]: string;
}

interface Props {
  audioEnabled: boolean;
  audioFile: MediaFile | null;
  onToggle: () => void;
  onFileSelect: (media: MediaFile) => void;
  onRemoveAudio: () => void;
  t: Translations;
}

export function AudioControls({
  audioEnabled,
  audioFile,
  onToggle,
  onFileSelect,
  onRemoveAudio,
  t,
}: Props) {
  return (
    <div className="audio-panel">
      <h3>{t.audio}</h3>
      <div className="audio-row">
        <button
          className={`btn-toggle ${audioEnabled ? 'active' : ''}`}
          onClick={onToggle}
        >
          {audioEnabled ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
          {audioEnabled ? t.audioOn : t.audioOff}
        </button>
        <button className="btn-secondary" onClick={onRemoveAudio}>
          {t.removeAudio}
        </button>
      </div>
      <div className="audio-upload">
        <VideoUploader
          label={t.addAudioFile}
          accept="audio/*"
          onFileSelect={onFileSelect}
          currentFile={audioFile}
          compact
        />
      </div>
    </div>
  );
}
