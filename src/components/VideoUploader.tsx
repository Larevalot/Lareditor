import { useRef, type DragEvent } from 'react';
import type { MediaFile } from '../types';

interface Props {
  label: string;
  accept: string;
  onFileSelect: (media: MediaFile) => void;
  currentFile?: MediaFile | null;
  compact?: boolean;
}

export function VideoUploader({ label, accept, onFileSelect, currentFile, compact }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const type = file.type.startsWith('video') ? 'video' : 'image';
    onFileSelect({
      file,
      url: URL.createObjectURL(file),
      type,
      name: file.name,
    });
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (compact) {
    return (
      <div
        className="uploader-compact"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          hidden
        />
        {currentFile ? (
          <span className="file-name">{currentFile.name}</span>
        ) : (
          <span className="upload-hint">{label}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className="uploader"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        hidden
      />
      <div className="uploader-content">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>{label}</span>
      </div>
    </div>
  );
}
