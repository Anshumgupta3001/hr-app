import { useEffect, useRef, useState } from 'react';
import { documentService } from '../services/documentService.js';
import CandyButton from './CandyButton.jsx';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-2.5 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function OtherDocumentsList({ companyId, employeeId, readOnly = false }) {
  const inputRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [label, setLabel] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const all = await documentService.getDocumentsForEmployee(employeeId);
    setDocs(all.filter((d) => d.documentType === 'other'));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  function handleFilePick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const validationError = documentService.validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setPendingFile(file);
  }

  async function handleAdd() {
    if (!pendingFile || !label.trim()) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const saved = await documentService.uploadDocument({
        companyId,
        employeeId,
        documentType: 'other',
        file: pendingFile,
        label,
      });
      if (saved.storageType === 'local') {
        setNotice('Saved on this device — will sync once the server is reachable.');
      }
      setLabel('');
      setPendingFile(null);
      // Prepend directly instead of re-fetching: a local-fallback record
      // isn't queryable from the server, so a full reload would make it
      // vanish immediately after it was just saved.
      setDocs((prev) => [saved, ...prev]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id) {
    setBusy(true);
    setNotice('');
    try {
      await documentService.removeDocument(id);
      // Filter locally rather than re-fetching: a re-fetch only knows about
      // server-side records and would silently drop any other still-visible
      // local-fallback documents from the list.
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleView(doc) {
    try {
      const url = await documentService.resolveDocumentSource(doc);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="rounded-chip bg-clay-input p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1">
              <label className="block font-bold text-sm mb-1.5">Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Offer Letter"
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex-1">
              <label className="block font-bold text-sm mb-1.5">File</label>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFilePick}
                className="w-full text-sm font-bold text-ink file:mr-3 file:rounded-btn file:border-0 file:bg-white file:shadow-clayButton file:px-3 file:py-2 file:font-bold file:text-sm"
              />
            </div>
            <CandyButton
              type="button"
              variant="mustard"
              small
              disabled={!pendingFile || !label.trim() || busy}
              onClick={handleAdd}
              className="rounded-full whitespace-nowrap"
            >
              + Add Document
            </CandyButton>
          </div>
          {notice && <p className="text-mustard font-bold text-xs mt-2">{notice}</p>}
          {error && <p className="text-coral font-bold text-xs mt-2">{error}</p>}
        </div>
      )}

      {docs.length === 0 ? (
        <p className="text-xs text-muted">No additional documents.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-chip bg-white/70 backdrop-blur-xl shadow-clayCard px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{doc.label || doc.fileName}</p>
                <p className="text-xs text-muted truncate">{doc.fileName}</p>
              </div>
              <button
                type="button"
                onClick={() => handleView(doc)}
                className="text-xs font-bold text-violet hover:underline shrink-0"
              >
                View
              </button>
              {!readOnly && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleRemove(doc.id)}
                  className="text-xs font-bold text-coral hover:underline shrink-0 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
