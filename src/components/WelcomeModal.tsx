import { useState } from 'react';
import type { Lang } from '../i18n';

interface ProjectConfig {
  maxDuration: number;
  width: number;
  height: number;
  fps: number;
  backgroundColor: string;
}

interface WelcomeModalProps {
  lang: Lang;
  onSelectTemplate: (config: ProjectConfig) => void;
  onSelectCustom: (config: ProjectConfig) => void;
}

const RESOLUTION_PRESETS = [
  { label: '4K', width: 3840, height: 2160 },
  { label: '1080p', width: 1920, height: 1080 },
  { label: '720p', width: 1280, height: 720 },
  { label: '480p', width: 854, height: 480 },
];

const FPS_OPTIONS = [24, 25, 30, 60];

const DURATION_PRESETS = [15, 30, 60, 120, 300];

const modalTranslations = {
  en: {
    welcomeTitle: 'Welcome to larEditor',
    welcomeSubtitle: 'How would you like to start?',
    templateOption: 'Use Template',
    templateDesc: 'Start with a predefined configuration based on a base video',
    customOption: 'Custom Project',
    customDesc: 'Start from scratch with your own settings',
    maxDuration: 'Max Duration',
    resolution: 'Resolution',
    orientation: 'Orientation',
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    fps: 'FPS',
    backgroundColor: 'Background Color',
    totalDuration: 'Total Duration',
    seconds: 'seconds',
    startEditing: 'Start Editing',
    back: 'Back',
  },
  es: {
    welcomeTitle: 'Bienvenido a larEditor',
    welcomeSubtitle: '¿Cómo te gustaría empezar?',
    templateOption: 'Usar Plantilla',
    templateDesc: 'Comenzar con una configuración predefinida basada en un video base',
    customOption: 'Proyecto Personalizado',
    customDesc: 'Empezar desde cero con tu propia configuración',
    maxDuration: 'Duración Máxima',
    resolution: 'Resolución',
    orientation: 'Orientación',
    horizontal: 'Horizontal',
    vertical: 'Vertical',
    fps: 'FPS',
    backgroundColor: 'Color de Fondo',
    totalDuration: 'Duración Total',
    seconds: 'segundos',
    startEditing: 'Comenzar a Editar',
    back: 'Volver',
  },
  it: {
    welcomeTitle: 'Benvenuto in larEditor',
    welcomeSubtitle: 'Come vorresti iniziare?',
    templateOption: 'Usa Modello',
    templateDesc: 'Inizia con una configurazione predefinita basata su un video base',
    customOption: 'Progetto Personalizzato',
    customDesc: 'Inizia da zero con le tue impostazioni',
    maxDuration: 'Durata Massima',
    resolution: 'Risoluzione',
    orientation: 'Orientamento',
    horizontal: 'Orizzontale',
    vertical: 'Verticale',
    fps: 'FPS',
    backgroundColor: 'Colore di Sfondo',
    totalDuration: 'Durata Totale',
    seconds: 'secondi',
    startEditing: 'Inizia a Modificare',
    back: 'Indietro',
  },
};

export function WelcomeModal({ lang, onSelectTemplate, onSelectCustom }: WelcomeModalProps) {
  const [step, setStep] = useState<'choose' | 'template' | 'custom'>('choose');
  const [templateConfig, setTemplateConfig] = useState<ProjectConfig>({
    maxDuration: 30,
    width: 1920,
    height: 1080,
    fps: 30,
    backgroundColor: '#000000',
  });
  const [customConfig, setCustomConfig] = useState<ProjectConfig>({
    maxDuration: 30,
    width: 1920,
    height: 1080,
    fps: 30,
    backgroundColor: '#000000',
  });
  const [templateOrientation, setTemplateOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [customOrientation, setCustomOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

  const t = modalTranslations[lang] || modalTranslations.en;

  const applyResolution = (preset: typeof RESOLUTION_PRESETS[0], orientation: 'horizontal' | 'vertical') => {
    if (orientation === 'vertical') {
      return { width: preset.height, height: preset.width };
    }
    return { width: preset.width, height: preset.height };
  };

  if (step === 'template') {
    return (
      <div className="welcome-overlay">
        <div className="welcome-modal">
          <div className="welcome-header">
            <div className="welcome-logo">
              <span className="welcome-logo-mark">[v]</span>
              <span className="welcome-logo-text">larEditor</span>
            </div>
            <h2>{t.templateOption}</h2>
            <p className="welcome-subtitle">{t.templateDesc}</p>
          </div>

          <div className="welcome-config">
            <div className="config-field">
              <label>{t.maxDuration}</label>
              <div className="config-chips">
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d}
                    className={`config-chip ${templateConfig.maxDuration === d ? 'active' : ''}`}
                    onClick={() => setTemplateConfig((prev) => ({ ...prev, maxDuration: d }))}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            <div className="config-field">
              <label>{t.resolution}</label>
              <div className="config-chips">
                {RESOLUTION_PRESETS.map((r) => {
                  const isActive = templateOrientation === 'horizontal'
                    ? (templateConfig.width === r.width && templateConfig.height === r.height)
                    : (templateConfig.width === r.height && templateConfig.height === r.width);
                  return (
                    <button
                      key={r.label}
                      className={`config-chip ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        const res = applyResolution(r, templateOrientation);
                        setTemplateConfig((prev) => ({ ...prev, ...res }));
                      }}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="config-field">
              <label>{t.orientation}</label>
              <div className="config-chips">
                <button
                  className={`config-chip ${templateOrientation === 'horizontal' ? 'active' : ''}`}
                  onClick={() => {
                    setTemplateOrientation('horizontal');
                    if (templateConfig.height > templateConfig.width) {
                      setTemplateConfig((prev) => ({ ...prev, width: prev.height, height: prev.width }));
                    }
                  }}
                >
                  {t.horizontal}
                </button>
                <button
                  className={`config-chip ${templateOrientation === 'vertical' ? 'active' : ''}`}
                  onClick={() => {
                    setTemplateOrientation('vertical');
                    if (templateConfig.width > templateConfig.height) {
                      setTemplateConfig((prev) => ({ ...prev, width: prev.height, height: prev.width }));
                    }
                  }}
                >
                  {t.vertical}
                </button>
              </div>
            </div>

            <div className="config-field">
              <label>{t.fps}</label>
              <div className="config-chips">
                {FPS_OPTIONS.map((f) => (
                  <button
                    key={f}
                    className={`config-chip ${templateConfig.fps === f ? 'active' : ''}`}
                    onClick={() => setTemplateConfig((prev) => ({ ...prev, fps: f }))}
                  >
                    {f} FPS
                  </button>
                ))}
              </div>
            </div>

            <div className="config-field">
              <label>{t.backgroundColor}</label>
              <div className="config-color-row">
                <input
                  type="color"
                  value={templateConfig.backgroundColor}
                  onChange={(e) => setTemplateConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                  className="config-color-input"
                />
                <input
                  type="text"
                  value={templateConfig.backgroundColor}
                  onChange={(e) => setTemplateConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                  className="config-hex-input"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          <div className="welcome-actions">
            <button className="welcome-btn-secondary" onClick={() => setStep('choose')}>
              {t.back}
            </button>
            <button className="welcome-btn-primary" onClick={() => onSelectTemplate(templateConfig)}>
              {t.startEditing}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'custom') {
    return (
      <div className="welcome-overlay">
        <div className="welcome-modal">
          <div className="welcome-header">
            <div className="welcome-logo">
              <span className="welcome-logo-mark">[v]</span>
              <span className="welcome-logo-text">larEditor</span>
            </div>
            <h2>{t.customOption}</h2>
            <p className="welcome-subtitle">{t.customDesc}</p>
          </div>

          <div className="welcome-config">
            <div className="config-field">
              <label>{t.resolution}</label>
              <div className="config-chips">
                {RESOLUTION_PRESETS.map((r) => {
                  const isActive = customOrientation === 'horizontal'
                    ? (customConfig.width === r.width && customConfig.height === r.height)
                    : (customConfig.width === r.height && customConfig.height === r.width);
                  return (
                    <button
                      key={r.label}
                      className={`config-chip ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        const res = applyResolution(r, customOrientation);
                        setCustomConfig((prev) => ({ ...prev, ...res }));
                      }}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
              <div className="config-resolution-custom">
                <input
                  type="number"
                  value={customConfig.width}
                  onChange={(e) => setCustomConfig((prev) => ({ ...prev, width: +e.target.value || 1920 }))}
                  className="config-res-input"
                />
                <span className="config-res-separator">×</span>
                <input
                  type="number"
                  value={customConfig.height}
                  onChange={(e) => setCustomConfig((prev) => ({ ...prev, height: +e.target.value || 1080 }))}
                  className="config-res-input"
                />
              </div>
            </div>

            <div className="config-field">
              <label>{t.orientation}</label>
              <div className="config-chips">
                <button
                  className={`config-chip ${customOrientation === 'horizontal' ? 'active' : ''}`}
                  onClick={() => {
                    setCustomOrientation('horizontal');
                    if (customConfig.height > customConfig.width) {
                      setCustomConfig((prev) => ({ ...prev, width: prev.height, height: prev.width }));
                    }
                  }}
                >
                  {t.horizontal}
                </button>
                <button
                  className={`config-chip ${customOrientation === 'vertical' ? 'active' : ''}`}
                  onClick={() => {
                    setCustomOrientation('vertical');
                    if (customConfig.width > customConfig.height) {
                      setCustomConfig((prev) => ({ ...prev, width: prev.height, height: prev.width }));
                    }
                  }}
                >
                  {t.vertical}
                </button>
              </div>
            </div>

            <div className="config-field">
              <label>{t.fps}</label>
              <div className="config-chips">
                {FPS_OPTIONS.map((f) => (
                  <button
                    key={f}
                    className={`config-chip ${customConfig.fps === f ? 'active' : ''}`}
                    onClick={() => setCustomConfig((prev) => ({ ...prev, fps: f }))}
                  >
                    {f} FPS
                  </button>
                ))}
              </div>
            </div>

            <div className="config-field">
              <label>{t.backgroundColor}</label>
              <div className="config-color-row">
                <input
                  type="color"
                  value={customConfig.backgroundColor}
                  onChange={(e) => setCustomConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                  className="config-color-input"
                />
                <input
                  type="text"
                  value={customConfig.backgroundColor}
                  onChange={(e) => setCustomConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                  className="config-hex-input"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="config-field">
              <label>{t.totalDuration} ({t.seconds})</label>
              <input
                type="number"
                value={customConfig.maxDuration}
                onChange={(e) => setCustomConfig((prev) => ({ ...prev, maxDuration: +e.target.value || 30 }))}
                className="config-duration-input"
                min={1}
                max={3600}
              />
            </div>
          </div>

          <div className="welcome-actions">
            <button className="welcome-btn-secondary" onClick={() => setStep('choose')}>
              {t.back}
            </button>
            <button className="welcome-btn-primary" onClick={() => onSelectCustom(customConfig)}>
              {t.startEditing}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-overlay">
      <div className="welcome-modal">
        <div className="welcome-header">
          <div className="welcome-logo">
            <span className="welcome-logo-mark">[v]</span>
            <span className="welcome-logo-text">larEditor</span>
          </div>
          <h2>{t.welcomeTitle}</h2>
          <p className="welcome-subtitle">{t.welcomeSubtitle}</p>
        </div>

        <div className="welcome-options">
          <button className="welcome-option" onClick={() => setStep('template')}>
            <div className="welcome-option-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <line x1="2" y1="8" x2="22" y2="8" />
                <line x1="8" y1="8" x2="8" y2="22" />
              </svg>
            </div>
            <div className="welcome-option-content">
              <h3>{t.templateOption}</h3>
              <p>{t.templateDesc}</p>
            </div>
            <svg className="welcome-option-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button className="welcome-option" onClick={() => setStep('custom')}>
            <div className="welcome-option-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="welcome-option-content">
              <h3>{t.customOption}</h3>
              <p>{t.customDesc}</p>
            </div>
            <svg className="welcome-option-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
