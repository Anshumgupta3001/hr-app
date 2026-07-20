import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import ExpenseStatusPill from '../components/ExpenseStatusPill.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { expenseService } from '../services/expenseService.js';

const TABS = ['pending', 'approved', 'denied', 'all'];

export default function ExpenseClaims() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [claims, setClaims] = useState([]);
  const [tab, setTab] = useState('pending');
  const [decidingIds, setDecidingIds] = useState([]);

  const loadClaims = useCallback(async () => {
    setClaims(await expenseService.getClaimsByCompany(companyId));
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
          current.role === 'superadmin' ? '/super-admin' : `/expenses/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/expense-claims/${current.companyId}`, { replace: true });
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
      await loadClaims();
    }
    load();
  }, [navigate, companyId, loadClaims]);

  if (!user || !company) return null;

  const canDecide = user.role === 'admin';

  function employeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  async function decide(claimId, decision) {
    setDecidingIds((ids) => [...ids, claimId]);
    await expenseService.decideClaim(claimId, decision, user.id);
    await loadClaims();
    setDecidingIds((ids) => ids.filter((id) => id !== claimId));
  }

  const visible = tab === 'all' ? claims : claims.filter((c) => c.status === tab);

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Expense Claims</h1>

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
          No {tab === 'all' ? '' : tab + ' '}claims.
        </p>
      ) : (
        <div className="space-y-4 mt-8 pb-10">
          {visible.map((claim) => {
            const deciding = decidingIds.includes(claim.id);
            return (
              <OutlinedCard key={claim.id} className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-lg">
                      {employeeName(claim.employeeId)}{' '}
                      <span className="text-muted font-body text-sm font-bold">
                        · {claim.category} · ₹{claim.amount}
                      </span>
                    </p>
                    <p className="text-sm text-muted mt-0.5">
                      Incurred {claim.dateIncurred} · Submitted{' '}
                      {new Date(claim.submittedAt).toLocaleDateString()}
                    </p>
                    {claim.description && (
                      <p className="text-sm text-muted mt-1 italic">“{claim.description}”</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <ExpenseStatusPill status={claim.status} />
                    {canDecide && claim.status === 'pending' && (
                      <>
                        <CandyButton
                          variant="teal"
                          small
                          disabled={deciding}
                          onClick={() => decide(claim.id, 'approved')}
                        >
                          Approve
                        </CandyButton>
                        <CandyButton
                          variant="primary"
                          small
                          disabled={deciding}
                          onClick={() => decide(claim.id, 'denied')}
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
