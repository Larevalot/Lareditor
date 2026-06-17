interface Translations {
  [key: string]: string;
}

interface Props {
  canExport: boolean;
  isExporting: boolean;
  progress: number;
  onExport: () => void;
  onDownload: () => void;
  hasResult: boolean;
  t: Translations;
}

export function ExportPanel({
  canExport,
  isExporting,
  progress,
  onExport,
  onDownload,
  hasResult,
  t,
}: Props) {
  return (
    <div className="export-panel">
      <h3>{t.export}</h3>
      <div className="export-actions">
        <button
          className="btn-primary"
          disabled={!canExport || isExporting}
          onClick={onExport}
        >
          {isExporting ? (
            <>
              <span className="spinner" />
              {t.processing} {progress}%
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t.renderVideo}
            </>
          )}
        </button>
        {hasResult && (
          <button className="btn-download" onClick={onDownload}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {t.downloadResult}
          </button>
        )}
      </div>
      {isExporting && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
