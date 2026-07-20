import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import SuperAdminAppShell from '../components/SuperAdminAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { leavePolicyService } from '../services/leavePolicyService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-2.5 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function DefaultLeavePolicy() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (current.role !== 'superadmin') {
        navigate(`/dashboard/${current.companyId}`, { replace: true });
        return;
      }
      const policy = await leavePolicyService.getGlobalPolicy();
      setUser(current);
      setRows(policy.leaveTypes.map((t) => ({ ...t })));
    }
    load();
  }, [navigate]);

  if (!user) return null;

  function updateRow(key, field, value) {
    setRows(rows.map((r) => ((r.id || r.tempKey) === key ? { ...r, [field]: value } : r)));
    setSaved(false);
  }

  function removeRow(key) {
    setRows(rows.filter((r) => (r.id || r.tempKey) !== key));
    setSaved(false);
  }

  function addRow() {
    // tempKey is a client-only React key for the unsaved row — it is never
    // sent to the backend, which mints the real id once it's saved.
    setRows([...rows, { tempKey: uuidv4(), name: '', annualQuota: 0 }]);
    setSaved(false);
  }

  const canSave = rows.some((r) => r.name.trim());

  async function handleSave() {
    if (!canSave) return;
    setError('');
    setSaved(false);
    try {
      const updated = await leavePolicyService.updateGlobalPolicy(rows);
      setRows(updated.leaveTypes.map((t) => ({ ...t })));
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <SuperAdminAppShell user={user} calm>
      <BackButton className="mb-4" />
      <OutlinedCard className="p-8 max-w-xl">
        <h1 className="font-display font-extrabold text-3xl mb-1">
          Default Leave Policy
        </h1>
            <p className="text-sm text-muted mb-6">
              This only applies to companies created after you save changes here.
            </p>
            <div className="space-y-3">
              <div className="flex gap-3 text-xs font-bold uppercase tracking-widest text-muted">
                <span className="flex-1">Leave Type</span>
                <span className="w-24">Quota / yr</span>
                <span className="w-6" />
              </div>
              {rows.map((row) => (
                <div key={row.id || row.tempKey} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(row.id || row.tempKey, 'name', e.target.value)}
                    placeholder="Leave type name"
                    className={`${INPUT_CLASS} flex-1`}
                  />
                  <input
                    type="number"
                    min="0"
                    value={row.annualQuota}
                    onChange={(e) =>
                      updateRow(row.id || row.tempKey, 'annualQuota', e.target.value)
                    }
                    className={`${INPUT_CLASS} w-24`}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${row.name || 'row'}`}
                    onClick={() => removeRow(row.id || row.tempKey)}
                    className="w-6 font-bold text-lg hover:text-coral"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <CandyButton variant="mustard" small className="rounded-full" onClick={addRow}>
                + Add Leave Type
              </CandyButton>
            </div>
            {error && <p className="text-coral font-bold text-sm mt-4">{error}</p>}
            {saved && <p className="text-teal font-bold text-sm mt-4">Policy saved.</p>}
            <CandyButton
              variant="primary"
              disabled={!canSave}
              onClick={handleSave}
              className="w-full mt-6"
            >
              Save Policy
            </CandyButton>
      </OutlinedCard>
    </SuperAdminAppShell>
  );
}
