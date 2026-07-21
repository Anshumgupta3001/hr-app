import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import AttendanceStatusPill from '../components/AttendanceStatusPill.jsx';
import MonthlySummaryCard from '../components/MonthlySummaryCard.jsx';
import AttendancePatternStrip from '../components/AttendancePatternStrip.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { attendanceService } from '../services/attendanceService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function targetCompletionTime(clockInTime, expectedWorkHours) {
  const target = new Date(clockInTime);
  target.setTime(target.getTime() + expectedWorkHours * 3600000);
  return formatTime(target);
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Location permission was denied.')),
      { enableHighAccuracy: true }
    );
  });
}

function CorrectionModal({ record, onClose, onSubmitted }) {
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await attendanceService.createRegularization({
        date: record.date,
        requestedClockInTime: clockIn ? new Date(`${record.date}T${clockIn}`).toISOString() : null,
        requestedClockOutTime: clockOut ? new Date(`${record.date}T${clockOut}`).toISOString() : null,
        reason: reason.trim(),
      });
      onSubmitted();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
      <OutlinedCard className="w-full max-w-md p-8">
        <h2 className="font-display font-bold text-xl mb-1">Request Correction</h2>
        <p className="text-sm text-muted mb-6">For {record.date}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-sm mb-1.5">Proposed Clock In</label>
            <input
              type="time"
              value={clockIn}
              onChange={(e) => setClockIn(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1.5">Proposed Clock Out</label>
            <input
              type="time"
              value={clockOut}
              onChange={(e) => setClockOut(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1.5">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className={INPUT_CLASS}
              placeholder="Forgot to clock in, was in a client meeting..."
            />
          </div>
          {error && <p className="text-coral font-bold text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <CandyButton type="button" variant="secondary" small onClick={onClose}>
              Cancel
            </CandyButton>
            <CandyButton type="submit" variant="primary" small disabled={submitting}>
              Submit
            </CandyButton>
          </div>
        </form>
      </OutlinedCard>
    </div>
  );
}

export default function MyAttendance() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [history, setHistory] = useState([]);
  const [month, setMonth] = useState(currentMonthValue());
  const [summary, setSummary] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [correctionRecord, setCorrectionRecord] = useState(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const loadAll = useCallback(async (currentUser, targetMonth) => {
    const [shiftPolicy, myHistory] = await Promise.all([
      attendanceService.getShiftPolicy(),
      attendanceService.getMyAttendance(),
    ]);
    setPolicy(shiftPolicy);
    setHistory(myHistory);
    setSummary(await attendanceService.getSummary({ employeeId: currentUser.id, month: targetMonth }));
  }, []);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (!['hr', 'manager', 'employee', 'admin'].includes(current.role)) {
        navigate(current.role === 'superadmin' ? '/super-admin' : '/', { replace: true });
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/attendance/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      await loadAll(current, currentMonthValue());
    }
    load();
  }, [navigate, companyId, loadAll]);

  async function reload() {
    setActionLoading(false);
    setCorrectionRecord(null);
    await loadAll(user, month);
  }

  async function handleMonthChange(newMonth) {
    setMonth(newMonth);
    setSummary(await attendanceService.getSummary({ employeeId: user.id, month: newMonth }));
  }

  async function handleClockIn() {
    setActionError('');
    setActionLoading(true);
    try {
      const { latitude, longitude } = await getLocation();
      await attendanceService.clockIn({ latitude, longitude });
      await loadAll(user, month);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClockOut() {
    setActionError('');
    setActionLoading(true);
    try {
      const { latitude, longitude } = await getLocation();
      await attendanceService.clockOut({ latitude, longitude });
      await loadAll(user, month);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (!user || !company || !policy) return null;

  const todayRecord = history.find((r) => r.date === todayStr) || null;

  function renderTodayWidget() {
    if (!todayRecord || !todayRecord.clockInTime) {
      return (
        <CandyButton variant="primary" disabled={actionLoading} onClick={handleClockIn}>
          {actionLoading ? 'Getting location…' : 'Clock In'}
        </CandyButton>
      );
    }

    if (!todayRecord.clockOutTime) {
      return (
        <div className="space-y-3">
          <p className="font-bold">Clocked in at {formatTime(todayRecord.clockInTime)}</p>
          <p className="text-sm text-muted font-bold">
            {policy.expectedWorkHours} hours completes at{' '}
            {targetCompletionTime(todayRecord.clockInTime, policy.expectedWorkHours)}
          </p>
          <CandyButton variant="teal" disabled={actionLoading} onClick={handleClockOut}>
            {actionLoading ? 'Getting location…' : 'Clock Out'}
          </CandyButton>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-6">
        <div>
          <p className="text-xs text-muted font-bold uppercase">Clock In</p>
          <p className="font-display font-bold text-lg">{formatTime(todayRecord.clockInTime)}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-bold uppercase">Clock Out</p>
          <p className="font-display font-bold text-lg">{formatTime(todayRecord.clockOutTime)}</p>
        </div>
        <div>
          <p className="text-xs text-muted font-bold uppercase">Total Hours</p>
          <p className="font-display font-bold text-lg">{todayRecord.totalHours?.toFixed(2)}</p>
        </div>
        <AttendanceStatusPill status={todayRecord.status} />
      </div>
    );
  }

  const otherHistory = history.filter((r) => r.date !== todayStr);

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">My Attendance</h1>

      <OutlinedCard className="p-6 mt-8">
        {renderTodayWidget()}
        {actionError && <p className="text-coral font-bold text-sm mt-4">{actionError}</p>}
      </OutlinedCard>

      <div className="flex items-center justify-between flex-wrap gap-4 mt-12 mb-6">
        <h2 className="font-display font-bold text-xl">Monthly Summary</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          className={`${INPUT_CLASS} w-auto`}
        />
      </div>

      {summary && (
        <>
          <MonthlySummaryCard summary={summary} />
          <OutlinedCard className="p-6 mt-6">
            <AttendancePatternStrip pattern={summary.pattern} />
          </OutlinedCard>
        </>
      )}

      <h2 className="font-display font-bold text-xl mt-12 mb-6">History</h2>
      {otherHistory.length === 0 ? (
        <p className="text-muted font-bold">No attendance history yet.</p>
      ) : (
        <div className="space-y-4 pb-10">
          {otherHistory.map((r) => (
            <OutlinedCard key={r.id} className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-display font-bold text-lg">{r.date}</p>
                  <p className="text-sm text-muted mt-0.5">
                    {r.clockInTime ? formatTime(r.clockInTime) : '—'} to{' '}
                    {r.clockOutTime ? formatTime(r.clockOutTime) : '—'}
                    {r.totalHours != null && ` · ${r.totalHours.toFixed(2)}h`}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <AttendanceStatusPill status={r.status} />
                  {['absent', 'incomplete'].includes(r.status) && (
                    <CandyButton variant="primary" small onClick={() => setCorrectionRecord(r)}>
                      Request Correction
                    </CandyButton>
                  )}
                </div>
              </div>
            </OutlinedCard>
          ))}
        </div>
      )}

      {correctionRecord && (
        <CorrectionModal
          record={correctionRecord}
          onClose={() => setCorrectionRecord(null)}
          onSubmitted={reload}
        />
      )}
    </CompanyAppShell>
  );
}
