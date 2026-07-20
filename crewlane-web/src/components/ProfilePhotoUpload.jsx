import { useEffect, useRef, useState } from 'react';
import { documentService } from '../services/documentService.js';

export default function ProfilePhotoUpload({ companyId, employeeId, readOnly = false }) {
  const inputRef = useRef(null);
  const [record, setRecord] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const doc = await documentService.getDocument(employeeId, 'profilePhoto');
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
  }, [employeeId]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const validationError = documentService.validateFile(file, { images_only: true });
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
        documentType: 'profilePhoto',
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

  return (
    <div className="flex items-center gap-5">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-clay-input shadow-clayCard shrink-0 flex items-center justify-center">
        {previewUrl ? (
          <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#635F69"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
          </svg>
        )}
      </div>
      {!readOnly && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={handleFile}
          />
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="rounded-btn bg-white shadow-clayButton px-4 py-2 font-bold text-sm text-ink hover:-translate-y-0.5 active:scale-[0.92] transition-all duration-150 disabled:opacity-50"
            >
              {record ? 'Replace Photo' : 'Upload Photo'}
            </button>
            {record && (
              <button
                type="button"
                disabled={busy}
                onClick={handleRemove}
                className="rounded-btn bg-white shadow-clayButton px-4 py-2 font-bold text-sm text-coral hover:-translate-y-0.5 active:scale-[0.92] transition-all duration-150 disabled:opacity-50"
              >
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-muted mt-2">JPG or PNG, max 5MB</p>
          {notice && <p className="text-mustard font-bold text-xs mt-1">{notice}</p>}
          {error && <p className="text-coral font-bold text-xs mt-1">{error}</p>}
        </div>
      )}
    </div>
  );
}
