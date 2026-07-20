import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { performanceService } from '../services/performanceService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

const REVIEW_STATUS_LABELS = {
  pending_self: 'Awaiting self-review',
  pending_manager: 'Awaiting manager review',
  completed: 'Completed',
};

const REVIEW_STATUS_STYLES = {
  pending_self: 'bg-mustard text-white',
  pending_manager: 'bg-sky text-white',
  completed: 'bg-teal text-white',
};

export default function ReviewCycles() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadCycles = useCallback(async () => {
    const list = await performanceService.getCyclesByCompany(companyId);
    setCycles(list);
    const active = list.find((c) => c.status === 'active');
    if (active) {
      setReviews(await performanceService.getReviewsByCycle(companyId, active.id));
    } else {
      setReviews([]);
    }
  }, [companyId]);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (current.role !== 'admin') {
        navigate(
          current.role === 'superadmin' ? '/super-admin' : `/dashboard/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/review-cycles/${current.companyId}`, { replace: true });
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
      await loadCycles();
    }
    load();
  }, [navigate, companyId, loadCycles]);

  if (!user || !company) return null;

  const activeCycle = cycles.find((c) => c.status === 'active') || null;
  const canCreate = name.trim() && startDate && endDate;

  async function handleCreate(e) {
    e.preventDefault();
    if (!canCreate) return;
    await performanceService.createCycle({ companyId, name, startDate, endDate });
    setName('');
    setStartDate('');
    setEndDate('');
    await loadCycles();
  }

  async function handleClose(cycleId) {
    await performanceService.closeCycle(cycleId);
    await loadCycles();
  }

  function reviewStatusFor(employeeId) {
    const review = reviews.find((r) => r.employeeId === employeeId);
    return review ? review.status : null;
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-8">Review Cycles</h1>

      <div className="max-w-2xl space-y-6 pb-10">
        <OutlinedCard className="p-6">
          <p className="font-display font-bold text-lg mb-4">Create a cycle</p>
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="H1 2026 Review"
              className={INPUT_CLASS}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-sm mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block font-bold text-sm mb-1.5">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <CandyButton type="submit" variant="primary" disabled={!canCreate} className="w-full">
              Create Cycle
            </CandyButton>
          </form>
        </OutlinedCard>

        {cycles.map((cycle) => (
          <OutlinedCard key={cycle.id} className="p-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-display font-bold text-lg">{cycle.name}</p>
                <p className="text-sm text-muted">
                  {cycle.startDate} to {cycle.endDate}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    cycle.status === 'active' ? 'bg-teal text-white' : 'bg-clay-input text-muted'
                  }`}
                >
                  {cycle.status}
                </span>
                {cycle.status === 'active' && (
                  <CandyButton variant="secondary" small onClick={() => handleClose(cycle.id)}>
                    Close Cycle
                  </CandyButton>
                )}
              </div>
            </div>

            {cycle.status === 'active' && activeCycle?.id === cycle.id && (
              <div className="mt-5 pt-4 border-t-2 border-ink/5 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">
                  Review completion
                </p>
                {employees.map((emp) => {
                  const status = reviewStatusFor(emp.id);
                  return (
                    <div key={emp.id} className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold truncate">{emp.name}</p>
                      <span
                        className={`rounded-full px-3 py-0.5 text-xs font-bold shrink-0 ${
                          status
                            ? REVIEW_STATUS_STYLES[status]
                            : 'bg-clay-input text-muted'
                        }`}
                      >
                        {status ? REVIEW_STATUS_LABELS[status] : 'Not started'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </OutlinedCard>
        ))}
      </div>
    </CompanyAppShell>
  );
}
