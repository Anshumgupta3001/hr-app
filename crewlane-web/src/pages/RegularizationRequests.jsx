import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { attendanceService } from '../services/attendanceService.js';

const TABS = ['pending', 'approved', 'denied', 'all'];

const STATUS_STYLES = {
  pending: 'bg-mustard',
  approved: 'bg-teal',
  denied: 'bg-coral',
};

function StatusPill({ status }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white shadow-clayButton ${STATUS_STYLES[status] || 'bg-white'}`}
    >
      {status}
    </span>
  );
}

function formatTime(dateStr) {
  return dateStr
    ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
}

export default function RegularizationRequests() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('pending');
  const [decidingIds, setDecidingIds] = useState([]);

  const loadRequests = useCallback(async () => {
    setRequests(await attendanceService.getRegularizations());
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
        navigate(`/regularization-requests/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      setEmployees(await employeeService.getEmployeesByCompany(companyId));
      await loadRequests();
    }
    load();
  }, [navigate, companyId, loadRequests]);

  if (!user || !company) return null;

  const canDecide = user.role === 'admin';

  function employeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  async function decide(id, action) {
    setDecidingIds((ids) => [...ids, id]);
    if (action === 'approve') {
      await attendanceService.approveRegularization(id);
    } else {
      await attendanceService.denyRegularization(id);
    }
    await loadRequests();
    setDecidingIds((ids) => ids.filter((i) => i !== id));
  }

  const visible = tab === 'all' ? requests : requests.filter((r) => r.status === tab);

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
        Regularization Requests
      </h1>

      <div className="flex gap-3 mt-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${
              tab === t ? 'bg-violet text-white shadow-clayButton' : 'bg-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-muted font-bold">
          No {tab === 'all' ? '' : tab + ' '}requests.
        </p>
      ) : (
        <div className="space-y-4 mt-8 pb-10">
          {visible.map((req) => {
            const deciding = decidingIds.includes(req.id);
            return (
              <OutlinedCard key={req.id} className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-lg">
                      {employeeName(req.employeeId)}{' '}
                      <span className="text-muted font-body text-sm font-bold">
                        · {req.date}
                      </span>
                    </p>
                    <p className="text-sm text-muted mt-0.5">
                      Proposed {formatTime(req.requestedClockInTime)} to{' '}
                      {formatTime(req.requestedClockOutTime)}
                    </p>
                    {req.reason && <p className="text-sm text-muted mt-1 italic">“{req.reason}”</p>}
                    <p className="text-xs text-muted mt-1">
                      Submitted {new Date(req.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <StatusPill status={req.status} />
                    {canDecide && req.status === 'pending' && (
                      <>
                        <CandyButton
                          variant="teal"
                          small
                          disabled={deciding}
                          onClick={() => decide(req.id, 'approve')}
                        >
                          Approve
                        </CandyButton>
                        <CandyButton
                          variant="primary"
                          small
                          disabled={deciding}
                          onClick={() => decide(req.id, 'deny')}
                        >
                          Deny
                        </CandyButton>
                      </>
                    )}
                  </div>
                </div>
              </OutlinedCard>
            );
          })}
        </div>
      )}
    </CompanyAppShell>
  );
}
