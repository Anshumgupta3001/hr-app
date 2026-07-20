import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import ConfettiBackground from '../components/ConfettiBackground.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { resignationService } from '../services/resignationService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function Resign() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [proposedLastWorkingDay, setProposedLastWorkingDay] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (current.role === 'superadmin') {
        navigate('/super-admin', { replace: true });
        return;
      }
      const requests = await resignationService.getByEmployee(current.id);
      setUser(current);
      setExisting(requests[0] || null);
      setLoaded(true);
    }
    load();
  }, [navigate]);

  if (!user || !loaded) return null;

  const canSubmit = proposedLastWorkingDay && reason.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    const created = await resignationService.submitResignation({
      companyId: user.companyId,
      employeeId: user.id,
      proposedLastWorkingDay,
      reason,
    });
    setExisting(created);
    setSubmitted(true);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10">
      <ConfettiBackground calm />
      <div className="relative z-10 w-full max-w-md">
        <OutlinedCard className="p-8">
          <BackButton className="mb-4" />
          <h1 className="font-display font-extrabold text-3xl mb-2">Resign</h1>

          {existing ? (
            <div className="space-y-3">
              {submitted && (
                <p className="text-teal font-bold text-sm">
                  Your resignation has been submitted.
                </p>
              )}
              <p className="text-sm text-muted">
                You submitted a resignation on{' '}
                {new Date(existing.submittedAt).toLocaleDateString()} with a proposed last
                working day of <span className="font-bold text-ink">{existing.proposedLastWorkingDay}</span>.
              </p>
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase text-white shadow-clayButton ${
                  existing.status === 'pending' ? 'bg-mustard' : 'bg-teal'
                }`}
              >
                {existing.status === 'pending' ? 'Awaiting acknowledgment' : 'Acknowledged'}
              </span>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted mb-6">
                This sends a resignation request to your admin. They'll acknowledge it and
                work out your notice period with you.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="lwd" className="block font-bold text-sm mb-1.5">
                    Proposed Last Working Day
                  </label>
                  <input
                    id="lwd"
                    type="date"
                    value={proposedLastWorkingDay}
                    onChange={(e) => setProposedLastWorkingDay(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="reason" className="block font-bold text-sm mb-1.5">
                    Reason
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why are you leaving?"
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </div>
                <CandyButton
                  type="submit"
                  variant="primary"
                  disabled={!canSubmit}
                  className="w-full"
                >
                  Submit Resignation
                </CandyButton>
              </form>
            </>
          )}
        </OutlinedCard>
      </div>
    </div>
  );
}
