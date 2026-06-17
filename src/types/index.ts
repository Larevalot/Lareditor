export interface MediaFile {
  file: File | null;
  url: string;
  type: 'video' | 'image' | 'text' | 'audio';
  name: string;
}

export interface OverlayItem {
  id: string;
  media: MediaFile;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  startTime: number;
  endTime: number;
  visible: boolean;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  audioVolume?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  timelineColor?: string;
}

export interface ProjectState {
  baseVideo: MediaFile | null;
  overlays: OverlayItem[];
  audioEnabled: boolean;
  audioFile: MediaFile | null;
  isExporting: boolean;
  exportProgress: number;
}
