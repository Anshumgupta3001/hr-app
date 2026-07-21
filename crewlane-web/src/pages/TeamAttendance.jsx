import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import AttendanceStatusPill from '../components/AttendanceStatusPill.jsx';
import AttendancePatternStrip from '../components/AttendancePatternStrip.jsx';
import CurrentlyInWidget from '../components/CurrentlyInWidget.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { attendanceService } from '../services/attendanceService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatTime(dateStr) {
  return dateStr
    ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
}

function downloadCsv(rows, filename) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function TeamAttendance() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [view, setView] = useState('daily');
  const [date, setDate] = useState(todayValue());
  const [month, setMonth] = useState(currentMonthValue());
  const [dailyRecords, setDailyRecords] = useState([]);
  const [monthlySummaries, setMonthlySummaries] = useState([]);
  const [currentlyIn, setCurrentlyIn] = useState([]);
  const [loading, setLoading] = useState(false);

  function employeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  const loadDaily = useCallback(async (targetDate) => {
    setLoading(true);
    setDailyRecords(await attendanceService.getTeamForDate(targetDate));
    setLoading(false);
  }, []);

  const loadMonthly = useCallback(async (targetMonth, employeeList) => {
    setLoading(true);
    const summaries = await Promise.all(
      employeeList.map(async (emp) => {
        const summary = await attendanceService.getSummary({
          employeeId: emp.id,
          month: targetMonth,
        });
        return { employee: emp, summary };
      })
    );
    setMonthlySummaries(summaries);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (!['admin', 'hr'].includes(current.role)) {
        navigate(
          current.role === 'superadmin' ? '/super-admin' : `/attendance/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/team-attendance/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      const emps = await employeeService.getEmployeesByCompany(companyId);
      setEmployees(emps);
      setCurrentlyIn(await attendanceService.getCurrentlyIn());
      await loadDaily(todayValue());
    }
    load();
  }, [navigate, companyId, loadDaily]);

  async function handleDateChange(newDate) {
    setDate(newDate);
    await loadDaily(newDate);
  }

  async function handleMonthChange(newMonth) {
    setMonth(newMonth);
    await loadMonthly(newMonth, employees);
  }

  async function handleViewChange(newView) {
    setView(newView);
    if (newView === 'monthly' && monthlySummaries.length === 0) {
      await loadMonthly(month, employees);
    }
  }

  function exportCsv() {
    const header = [
      'Employee',
      'Working Days',
      'Present',
      'Early Leave',
      'Incomplete',
      'Absent',
      'Leave Days',
      'Hours Worked',
      'Attendance %',
    ];
    const rows = monthlySummaries.map(({ employee, summary }) => [
      employee.name,
      summary.workingDays,
      summary.presentDays,
      summary.earlyLeaveDays,
      summary.incompleteDays,
      summary.absentDays,
      summary.leaveDays,
      summary.totalHoursWorked,
      summary.attendancePercentage,
    ]);
    downloadCsv([header, ...rows], `attendance-${month}.csv`);
  }

  if (!user || !company) return null;

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Team Attendance</h1>

      <div className="mt-8">
        <CurrentlyInWidget records={currentlyIn} employees={employees} />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 mt-10 mb-6">
        <div className="flex gap-3">
          {['daily', 'monthly'].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleViewChange(v)}
              className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${
                view === v ? 'bg-violet text-white shadow-clayButton' : 'bg-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {view === 'daily' ? (
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className={`${INPUT_CLASS} w-auto`}
          />
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className={`${INPUT_CLASS} w-auto`}
            />
            <CandyButton variant="mustard" small onClick={exportCsv}>
              Export CSV
            </CandyButton>
          </div>
        )}
      </div>

      {loading && <p className="text-muted font-bold">Loading…</p>}

      {!loading && view === 'daily' && (
        <OutlinedCard className="p-4 overflow-x-auto">
          {dailyRecords.length === 0 ? (
            <p className="text-muted font-bold p-4">No attendance records for this date.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted uppercase text-xs font-bold">
                  <th className="p-3">Employee</th>
                  <th className="p-3">Clock In</th>
                  <th className="p-3">Clock Out</th>
                  <th className="p-3">Total Hours</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {dailyRecords.map((r) => (
                  <tr key={r.id} className="border-t border-clay-input">
                    <td className="p-3 font-bold">{employeeName(r.employeeId)}</td>
                    <td className="p-3">
                      {formatTime(r.clockInTime)}
                      {r.clockInDistanceMeters != null && (
                        <span className="text-muted"> · {r.clockInDistanceMeters}m</span>
                      )}
                    </td>
                    <td className="p-3">
                      {formatTime(r.clockOutTime)}
                      {r.clockOutDistanceMeters != null && (
                        <span className="text-muted"> · {r.clockOutDistanceMeters}m</span>
                      )}
                    </td>
                    <td className="p-3">{r.totalHours != null ? r.totalHours.toFixed(2) : '—'}</td>
                    <td className="p-3">
                      <AttendanceStatusPill status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </OutlinedCard>
      )}

      {!loading && view === 'monthly' && (
        <div className="space-y-4 pb-10">
          {monthlySummaries.map(({ employee, summary }) => (
            <OutlinedCard key={employee.id} className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <p className="font-display font-bold text-lg">{employee.name}</p>
                <div className="flex gap-4 text-sm font-bold text-muted flex-wrap">
                  <span>Present {summary.presentDays}</span>
                  <span>Early Leave {summary.earlyLeaveDays}</span>
                  <span>Incomplete {summary.incompleteDays}</span>
                  <span>Absent {summary.absentDays}</span>
                  <span>Hours {summary.totalHoursWorked}</span>
                  <span>{summary.attendancePercentage}%</span>
                </div>
              </div>
              <AttendancePatternStrip pattern={summary.pattern} />
            </OutlinedCard>
          ))}
        </div>
      )}
    </CompanyAppShell>
  );
}
