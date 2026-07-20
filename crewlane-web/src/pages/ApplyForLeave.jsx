import { useMemo, useState } from 'react';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import BackButton from '../components/BackButton.jsx';
import { leaveRequestService } from '../services/leaveRequestService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export function calcTotalDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  return Math.round((end - start) / 86400000) + 1;
}

export default function ApplyForLeave({ user, companyId, policy, balances, onClose, onCreated }) {
  const [leaveTypeId, setLeaveTypeId] = useState(policy.leaveTypes[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalDays = useMemo(
    () => calcTotalDays(startDate, endDate),
    [startDate, endDate]
  );

  const remaining =
    balances.find((b) => b.leaveTypeId === leaveTypeId)?.remaining ?? 0;
  const exceedsBalance = totalDays > 0 && totalDays > remaining;

  const canSubmit = leaveTypeId && totalDays >= 1 && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await leaveRequestService.createRequest({
        companyId,
        employeeId: user.id,
        leaveTypeId,
        startDate,
        endDate,
        totalDays,
        reason,
      });
      onCreated();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-ink/40">
      <OutlinedCard className="p-8 w-full max-w-md relative bg-white max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-5 font-bold text-xl hover:text-coral"
        >
          ×
        </button>
        <BackButton onClick={onClose} className="mb-4" />
        <h2 className="font-display font-extrabold text-2xl mb-5">Apply for Leave</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="leaveType" className="block font-bold text-sm mb-1.5">
              Leave Type
            </label>
            <select
              id="leaveType"
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className={INPUT_CLASS}
            >
              {policy.leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDate" className="block font-bold text-sm mb-1.5">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block font-bold text-sm mb-1.5">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>
          {totalDays > 0 && (
            <p className="font-bold text-sm">
              Total days: <span className="font-display text-lg">{totalDays}</span>
            </p>
          )}
          {exceedsBalance && (
            <p className="text-coral font-bold text-sm">
              This exceeds your remaining balance of {remaining} day(s) for this leave
              type. You can still submit — your admin makes the final call.
            </p>
          )}
          <div>
            <label htmlFor="reason" className="block font-bold text-sm mb-1.5">
              Reason
            </label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="A short reason for your leave"
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>
          {error && <p className="text-coral font-bold text-sm">{error}</p>}
          <CandyButton type="submit" variant="primary" disabled={!canSubmit} className="w-full">
            Submit Request
          </CandyButton>
        </form>
      </OutlinedCard>
    </div>
  );
}
