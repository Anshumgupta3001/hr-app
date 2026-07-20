import { useEffect, useRef, useState } from 'react';
import { documentService } from '../services/documentService.js';

function DocIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#635F69"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
      <path d="M15 2v5h5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#635F69"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="M7 8l5-5 5 5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export default function DocumentUploadCard({
  companyId,
  employeeId,
  documentType,
  label,
  readOnly = false,
}) {
  const inputRef = useRef(null);
  const [record, setRecord] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const doc = await documentService.getDocument(employeeId, documentType);
    await showRecord(doc);
  }

  async function showRecord(doc) {
    setRecord(doc);
    if (doc) {
      try {
        setPreviewUrl(await documentService.resolveDocumentSource(doc));
      } catch {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, documentType]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const validationError = documentService.validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setNotice('');
    setBusy(true);
    try {
      const saved = await documentService.uploadDocument({
        companyId,
        employeeId,
        documentType,
        file,
      });
      if (saved.storageType === 'local') {
        setNotice('Saved on this device — will sync once the server is reachable.');
      }
      await showRecord(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!record) return;
    setBusy(true);
    setNotice('');
    try {
      await documentService.removeDocument(record.id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleView() {
    if (!record) return;
    try {
      const url = await documentService.resolveDocumentSource(record);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message);
    }
  }

  const isImage = record && record.mimeType.startsWith('image/');

  return (
    <div className="rounded-chip bg-clay-input p-4">
      <p className="font-bold text-sm mb-2">{label}</p>
      {!record ? (
        readOnly ? (
          <p className="text-xs text-muted">Not uploaded.</p>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-muted/30 rounded-chip p-5 flex flex-col items-center gap-2 hover:border-violet/40 transition-colors disabled:opacity-50"
          >
            <UploadIcon />
            <span className="text-xs font-bold text-muted">Tap to upload</span>
          </button>
        )
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleView}
            className="w-14 h-14 rounded-btn overflow-hidden bg-white shrink-0 flex items-center justify-center shadow-clayCard"
          >
            {isImage && previewUrl ? (
              <img src={previewUrl} alt={label} className="w-full h-full object-cover" />
            ) : (
              <DocIcon />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-ink truncate">{record.fileName}</p>
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={handleView}
                className="text-xs font-bold text-violet hover:underline"
              >
                View
              </button>
              {!readOnly && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => inputRef.current?.click()}
                    className="text-xs font-bold text-ink hover:underline disabled:opacity-50"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleRemove}
                    className="text-xs font-bold text-coral hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="hidden"
          onChange={handleFile}
        />
      )}
      {notice && <p className="text-mustard font-bold text-xs mt-2">{notice}</p>}
      {error && <p className="text-coral font-bold text-xs mt-2">{error}</p>}
    </div>
  );
}
