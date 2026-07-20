import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { expenseService, EXPENSE_CATEGORIES } from '../services/expenseService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function SubmitExpense() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [dateIncurred, setDateIncurred] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

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
        navigate(`/expenses/${current.companyId}/submit`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
    }
    load();
  }, [navigate, companyId]);

  if (!user || !company) return null;

  const canSubmit = category && Number(amount) > 0 && dateIncurred;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    try {
      await expenseService.createClaim({
        companyId,
        employeeId: user.id,
        category,
        amount,
        dateIncurred,
        description,
      });
      navigate(`/expenses/${companyId}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <OutlinedCard className="p-8 max-w-xl">
        <h1 className="font-display font-extrabold text-3xl mb-6">Submit Expense</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category" className="block font-bold text-sm mb-1.5">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={INPUT_CLASS}
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="amount" className="block font-bold text-sm mb-1.5">
              Amount (₹)
            </label>
            <input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1500"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="dateIncurred" className="block font-bold text-sm mb-1.5">
              Date Incurred
            </label>
            <input
              id="dateIncurred"
              type="date"
              value={dateIncurred}
              onChange={(e) => setDateIncurred(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="description" className="block font-bold text-sm mb-1.5">
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Vendor name, receipt number, what it was for — mention anything"
              className={`${INPUT_CLASS} resize-none`}
            />
          </div>
          {error && <p className="text-coral font-bold text-sm">{error}</p>}
          <CandyButton type="submit" variant="primary" disabled={!canSubmit} className="w-full">
            Submit Claim
          </CandyButton>
        </form>
      </OutlinedCard>
    </CompanyAppShell>
  );
}
