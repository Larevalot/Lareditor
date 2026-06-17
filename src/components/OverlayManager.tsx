import { useState } from 'react';
import { VideoUploader } from './VideoUploader';
import type { OverlayItem, MediaFile } from '../types';

const FONTS = [
  'Arial',
  'Verdana',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Impact',
];

interface Translations {
  [key: string]: string;
}

interface Props {
  overlays: OverlayItem[];
  onAdd: (media: MediaFile) => void;
  onAddText: (text: string, config: Partial<OverlayItem>) => void;
  onAddAudio: (media: MediaFile) => void;
  onUpdate: (id: string, updates: Partial<OverlayItem>) => void;
  onRemove: (id: string) => void;
  t: Translations;
}

export function OverlayManager({ overlays, onAdd, onAddText, onAddAudio, onUpdate, onRemove, t }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTextForm, setShowTextForm] = useState(false);
  const [textValue, setTextValue] = useState('Text');
  const [textFont, setTextFont] = useState('Arial');
  const [textSize, setTextSize] = useState(48);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBg, setTextBg] = useState('transparent');
  const [textOutlineColor, setTextOutlineColor] = useState('#000000');
  const [textOutlineWidth, setTextOutlineWidth] = useState(0);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const handleAddText = () => {
    if (!textValue.trim()) return;
    onAddText(textValue, {
      fontFamily: textFont,
      fontSize: textSize,
      fontColor: textColor,
      backgroundColor: textBg,
      outlineColor: textOutlineColor,
      outlineWidth: textOutlineWidth,
    });
    setShowTextForm(false);
    setTextValue('Text');
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="overlay-panel">
      <h3>{t.overlays}</h3>

      <div className="overlay-add-buttons">
        <VideoUploader
          label={t.imageVideo}
          accept="image/*,video/*"
          onFileSelect={onAdd}
          compact
        />
        <button
          className="btn-add-text"
          onClick={() => setShowTextForm(!showTextForm)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 7 4 4 20 4 20 7" />
            <line x1="9" y1="20" x2="15" y2="20" />
            <line x1="12" y1="4" x2="12" y2="20" />
          </svg>
          {t.text}
        </button>
        <VideoUploader
          label={t.audio}
          accept="audio/*"
          onFileSelect={onAddAudio}
          compact
        />
      </div>

      {showTextForm && (
        <div className="text-form">
          <input
            type="text"
            className="text-input"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder={t.writeText}
          />
          <div className="text-form-row">
            <label>
              {t.font}
              <select value={textFont} onChange={(e) => setTextFont(e.target.value)}>
                {FONTS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            <label>
              {t.size}
              <input
                type="number"
                min={8}
                max={200}
                value={textSize}
                onChange={(e) => setTextSize(+e.target.value)}
              />
            </label>
          </div>
          <div className="text-form-row">
            <label>
              {t.color}
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
            </label>
            <label>
              {t.background}
              <select value={textBg} onChange={(e) => setTextBg(e.target.value)}>
                <option value="transparent">{t.noBackground}</option>
                <option value="#000000">{t.black}</option>
                <option value="#FFFFFF">{t.white}</option>
                <option value="#6B8E23">Oliva</option>
              </select>
            </label>
          </div>
          <div className="text-form-row">
            <label>
              {t.outline}
              <input
                type="color"
                value={textOutlineColor}
                onChange={(e) => setTextOutlineColor(e.target.value)}
              />
            </label>
            <label>
              {t.thickness}
              <input
                type="number"
                min={0}
                max={10}
                value={textOutlineWidth}
                onChange={(e) => setTextOutlineWidth(+e.target.value)}
              />
            </label>
          </div>
          <button className="btn-confirm-text" onClick={handleAddText}>
            {t.addText}
          </button>
        </div>
      )}

      {overlays.length > 0 && (
        <div className="overlay-list">
          {overlays.map((o) => {
            const isExpanded = expandedId === o.id;
            const isAudio = o.media.type === 'audio';
            return (
              <div
                key={o.id}
                className={`overlay-item ${isExpanded ? 'expanded' : ''}`}
              >
                <div
                  className="overlay-item-header"
                  onClick={() => toggleExpand(o.id)}
                >
                  <span className="overlay-arrow">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span className="overlay-type-badge">
                    {o.media.type === 'image' ? 'IMG' : o.media.type === 'video' ? 'VID' : o.media.type === 'audio' ? 'AUD' : 'TXT'}
                  </span>
                  <span className="overlay-name">
                    {o.media.type === 'text' ? o.text : o.media.name}
                  </span>
                  <button
                    className="btn-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate(o.id, { visible: !o.visible });
                    }}
                  >
                    {o.visible ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(o.id);
                      if (expandedId === o.id) setExpandedId(null);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {isExpanded && (
                  <div className="overlay-controls">
                    {o.media.type === 'text' && (
                      <div className="control-group">
                        <span className="control-label">{t.text}</span>
                        <input
                          type="text"
                          className="text-input"
                          value={o.text || ''}
                          onChange={(e) => onUpdate(o.id, { text: e.target.value })}
                        />
                        <div className="text-form-row">
                          <label>
                            {t.font}
                            <select
                              value={o.fontFamily || 'Arial'}
                              onChange={(e) => onUpdate(o.id, { fontFamily: e.target.value })}
                            >
                              {FONTS.map((f) => (
                                <option key={f} value={f}>{f}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            {t.size}
                            <input
                              type="number"
                              min={8}
                              max={200}
                              value={o.fontSize || 48}
                              onChange={(e) => onUpdate(o.id, { fontSize: +e.target.value })}
                            />
                          </label>
                        </div>
                        <div className="text-form-row">
                          <label>
                            {t.color}
                            <input
                              type="color"
                              value={o.fontColor || '#FFFFFF'}
                              onChange={(e) => onUpdate(o.id, { fontColor: e.target.value })}
                            />
                          </label>
                          <label>
                            {t.background}
                            <select
                              value={o.backgroundColor || 'transparent'}
                              onChange={(e) => onUpdate(o.id, { backgroundColor: e.target.value })}
                            >
                              <option value="transparent">{t.noBackground}</option>
                              <option value="#000000">{t.black}</option>
                              <option value="#FFFFFF">{t.white}</option>
                              <option value="#6B8E23">Oliva</option>
                            </select>
                          </label>
                        </div>
                        <div className="text-form-row">
                          <label>
                            {t.outline}
                            <input
                              type="color"
                              value={o.outlineColor || '#000000'}
                              onChange={(e) => onUpdate(o.id, { outlineColor: e.target.value })}
                            />
                          </label>
                          <label>
                            {t.thickness}
                            <input
                              type="number"
                              min={0}
                              max={10}
                              value={o.outlineWidth ?? 0}
                              onChange={(e) => onUpdate(o.id, { outlineWidth: +e.target.value })}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {isAudio && (
                      <div className="control-group">
                        <span className="control-label">{t.volume}</span>
                        <label className="volume-label">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            {(o.audioVolume ?? 1) > 0 ? (
                              (o.audioVolume ?? 1) > 0.5 ? (
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                              ) : (
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                              )
                            ) : (
                              <>
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                              </>
                            )}
                          </svg>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={o.audioVolume ?? 1}
                            onChange={(e) => onUpdate(o.id, { audioVolume: +e.target.value })}
                          />
                          <span className="volume-value">{Math.round((o.audioVolume ?? 1) * 100)}%</span>
                        </label>
                      </div>
                    )}

                    {!isAudio && (
                      <div className="control-group">
                        <span className="control-label">{t.position}</span>
                        <div className="control-row">
                          <label>
                            X
                            <input
                              type="range"
                              min={0}
                              max={1920}
                              value={o.x}
                              onChange={(e) => onUpdate(o.id, { x: +e.target.value })}
                            />
                            <span>{o.x}</span>
                          </label>
                          <label>
                            Y
                            <input
                              type="range"
                              min={0}
                              max={1080}
                              value={o.y}
                              onChange={(e) => onUpdate(o.id, { y: +e.target.value })}
                            />
                            <span>{o.y}</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {o.media.type === 'image' || o.media.type === 'video' ? (
                      <div className="control-group">
                        <span className="control-label">{t.size}</span>
                        <div className="control-row">
                          <label>
                            {t.width}
                            <input
                              type="range"
                              min={10}
                              max={1920}
                              value={o.width}
                              onChange={(e) => onUpdate(o.id, { width: +e.target.value })}
                            />
                            <span>{o.width}</span>
                          </label>
                          <label>
                            {t.height}
                            <input
                              type="range"
                              min={10}
                              max={1080}
                              value={o.height}
                              onChange={(e) => onUpdate(o.id, { height: +e.target.value })}
                            />
                            <span>{o.height}</span>
                          </label>
                        </div>
                      </div>
                    ) : null}

                    {!isAudio && (
                      <div className="control-group">
                        <span className="control-label">{t.opacity}</span>
                        <label>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={o.opacity}
                            onChange={(e) => onUpdate(o.id, { opacity: +e.target.value })}
                          />
                          <span>{Math.round(o.opacity * 100)}%</span>
                        </label>
                      </div>
                    )}

                    <div className="control-group">
                      <span className="control-label">{t.appearanceTime}</span>
                      <div className="time-inputs">
                        <div className="time-field">
                          <span className="time-label">{t.start}</span>
                          <div className="time-input-row">
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={o.startTime}
                              onChange={(e) => onUpdate(o.id, { startTime: Math.max(0, +e.target.value) })}
                            />
                            <span className="time-display">{formatTime(o.startTime)}</span>
                          </div>
                        </div>
                        <div className="time-field">
                          <span className="time-label">{t.end}</span>
                          <div className="time-input-row">
                            <input
                              type="number"
                              min={0}
                              step={0.5}
                              value={o.endTime}
                              onChange={(e) => onUpdate(o.id, { endTime: Math.max(0, +e.target.value) })}
                            />
                            <span className="time-display">{formatTime(o.endTime)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="time-duration">
                        {t.duration}: {formatTime(Math.max(0, o.endTime - o.startTime))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
