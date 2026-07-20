import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import LeaveBalanceCard from '../components/LeaveBalanceCard.jsx';
import LeaveStatusPill from '../components/LeaveStatusPill.jsx';
import ApplyForLeave from './ApplyForLeave.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { leavePolicyService } from '../services/leavePolicyService.js';
import { leaveBalanceService } from '../services/leaveBalanceService.js';
import { leaveRequestService } from '../services/leaveRequestService.js';

export default function MyLeave() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showApply, setShowApply] = useState(false);

  const loadLeaveData = useCallback(
    async (currentUser) => {
      setPolicy(await leavePolicyService.getCompanyPolicy(companyId));
      setBalances(await leaveBalanceService.getBalances(currentUser.id, companyId));
      setRequests(await leaveRequestService.getRequestsByEmployee(currentUser.id));
    },
    [companyId]
  );

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (!['hr', 'manager', 'employee'].includes(current.role)) {
        navigate(
          current.role === 'superadmin' ? '/super-admin' : `/leave-requests/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/leave/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      await loadLeaveData(current);
    }
    load();
  }, [navigate, companyId, loadLeaveData]);

  if (!user || !company || !policy) return null;

  function typeName(leaveTypeId) {
    const type = policy.leaveTypes.find((t) => t.id === leaveTypeId);
    return type ? type.name : 'Leave';
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">My Leave</h1>
        <CandyButton variant="primary" onClick={() => setShowApply(true)}>
          + Apply for Leave
        </CandyButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
        {balances.map((balance) => (
          <LeaveBalanceCard key={balance.leaveTypeId} balance={balance} />
        ))}
      </div>

      <h2 className="font-display font-bold text-xl mt-12 mb-6">My Requests</h2>
      {requests.length === 0 ? (
        <p className="text-muted font-bold">No leave requests yet.</p>
      ) : (
        <div className="space-y-4 pb-10">
          {requests.map((req) => (
            <OutlinedCard key={req.id} className="p-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-display font-bold text-lg">
                    {typeName(req.leaveTypeId)}
                  </p>
                  <p className="text-sm text-muted mt-0.5">
                    {req.startDate} to {req.endDate} · {req.totalDays} day(s)
                  </p>
                  {req.reason && (
                    <p className="text-sm text-muted mt-1 italic">“{req.reason}”</p>
                  )}
                </div>
                <LeaveStatusPill status={req.status} />
              </div>
            </OutlinedCard>
          ))}
        </div>
      )}

      {showApply && (
        <ApplyForLeave
          user={user}
          companyId={companyId}
          policy={policy}
          balances={balances}
          onClose={() => setShowApply(false)}
          onCreated={async () => {
            setShowApply(false);
            await loadLeaveData(user);
          }}
        />
      )}
    </CompanyAppShell>
  );
}
