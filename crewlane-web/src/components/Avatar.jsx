import { useEffect, useState } from 'react';
import { documentService } from '../services/documentService.js';

export default function Avatar({
  employeeId,
  name,
  className = '',
  accentClassName = 'bg-gradient-to-br from-purple-400 to-purple-600',
  textClassName = 'text-lg',
}) {
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!employeeId) return;
      const record = await documentService.getDocument(employeeId, 'profilePhoto');
      if (!record) return;
      try {
        const url = await documentService.resolveDocumentSource(record);
        if (active) setPhotoUrl(url);
      } catch {
        // no backend/photo reachable — fall back to initials silently
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [employeeId]);

  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`object-cover shrink-0 ${className}`} />;
  }

  return (
    <div
      className={`flex items-center justify-center font-display font-extrabold text-white shrink-0 ${accentClassName} ${className}`}
    >
      <span className={textClassName}>{(name || '?').trim().charAt(0).toUpperCase()}</span>
    </div>
  );
}
