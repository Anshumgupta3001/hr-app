import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import ExpenseStatusPill from '../components/ExpenseStatusPill.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { expenseService } from '../services/expenseService.js';

export default function MyExpenses() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [claims, setClaims] = useState([]);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (!['hr', 'manager', 'employee'].includes(current.role)) {
        navigate(
          current.role === 'superadmin' ? '/super-admin' : `/expense-claims/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/expenses/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      setClaims(await expenseService.getClaimsByEmployee(current.id));
    }
    load();
  }, [navigate, companyId]);

  if (!user || !company) return null;

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">My Expenses</h1>
        <CandyButton
          variant="primary"
          onClick={() => navigate(`/expenses/${companyId}/submit`)}
        >
          + Submit Expense
        </CandyButton>
      </div>

      {claims.length === 0 ? (
        <p className="mt-10 text-muted font-bold">No expense claims yet.</p>
      ) : (
        <div className="space-y-4 mt-8 pb-10">
          {claims.map((claim) => (
            <OutlinedCard key={claim.id} className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <p className="font-display font-bold text-lg">
                    ₹{claim.amount}{' '}
                    <span className="text-muted font-body text-sm font-bold">
                      · {claim.category}
                    </span>
                  </p>
                  <p className="text-sm text-muted mt-0.5">
                    Incurred {claim.dateIncurred}
                  </p>
                  {claim.description && (
                    <p className="text-sm text-muted mt-1 italic">“{claim.description}”</p>
                  )}
                </div>
                <ExpenseStatusPill status={claim.status} />
              </div>
            </OutlinedCard>
          ))}
        </div>
      )}
    </CompanyAppShell>
  );
}
