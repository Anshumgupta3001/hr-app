import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import LeaveStatusPill from '../components/LeaveStatusPill.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { leavePolicyService } from '../services/leavePolicyService.js';
import { leaveRequestService } from '../services/leaveRequestService.js';

const TABS = ['pending', 'approved', 'denied', 'all'];

export default function LeaveRequests() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('pending');
  const [decidingIds, setDecidingIds] = useState([]);

  const loadRequests = useCallback(async () => {
    setRequests(await leaveRequestService.getRequestsByCompany(companyId));
  }, [companyId]);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (!['admin', 'hr'].includes(current.role)) {
        navigate(
          current.role === 'superadmin' ? '/super-admin' : `/leave/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/leave-requests/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      setPolicy(await leavePolicyService.getCompanyPolicy(companyId));
      setEmployees(await employeeService.getEmployeesByCompany(companyId));
      await loadRequests();
    }
    load();
  }, [navigate, companyId, loadRequests]);

  if (!user || !company || !policy) return null;

  const canDecide = user.role === 'admin';

  function employeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  function typeName(leaveTypeId) {
    const type = policy.leaveTypes.find((t) => t.id === leaveTypeId);
    return type ? type.name : 'Leave';
  }

  async function decide(requestId, action) {
    setDecidingIds((ids) => [...ids, requestId]);
    if (action === 'approve') {
      await leaveRequestService.approveRequest(requestId, user.id);
    } else {
      await leaveRequestService.denyRequest(requestId, user.id);
    }
    await loadRequests();
    setDecidingIds((ids) => ids.filter((id) => id !== requestId));
  }

  const visible = tab === 'all' ? requests : requests.filter((r) => r.status === tab);

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Leave Requests</h1>

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
                        · {typeName(req.leaveTypeId)}
                      </span>
                    </p>
                    <p className="text-sm text-muted mt-0.5">
                      {req.startDate} to {req.endDate} · {req.totalDays} day(s)
                    </p>
                    {req.reason && (
                      <p className="text-sm text-muted mt-1 italic">“{req.reason}”</p>
                    )}
                    <p className="text-xs text-muted mt-1">
                      Requested {new Date(req.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <LeaveStatusPill status={req.status} />
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
