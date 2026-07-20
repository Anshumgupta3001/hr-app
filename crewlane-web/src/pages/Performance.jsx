import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import GoalRow from '../components/GoalRow.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { performanceService } from '../services/performanceService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function Performance() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [goals, setGoals] = useState([]);
  const [review, setReview] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [selfRating, setSelfRating] = useState('3');
  const [selfComments, setSelfComments] = useState('');

  const loadCycleData = useCallback(async (currentUser) => {
    const activeCycle = await performanceService.getActiveCycle(currentUser.companyId);
    setCycle(activeCycle);
    if (activeCycle) {
      setGoals(await performanceService.getGoals(currentUser.id, activeCycle.id));
      setReview(
        await performanceService.getOrCreateReview(
          currentUser.companyId,
          activeCycle.id,
          currentUser.id
        )
      );
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (current.role === 'superadmin') {
        navigate('/super-admin', { replace: true });
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/performance/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      await loadCycleData(current);
    }
    load();
  }, [navigate, companyId, loadCycleData]);

  if (!user || !company || !loaded) return null;

  async function handleAddGoal(e) {
    e.preventDefault();
    if (!goalTitle.trim()) return;
    await performanceService.addGoal({
      companyId,
      employeeId: user.id,
      cycleId: cycle.id,
      title: goalTitle,
      description: goalDescription,
    });
    setGoalTitle('');
    setGoalDescription('');
    setGoals(await performanceService.getGoals(user.id, cycle.id));
  }

  async function handleGoalUpdate(goalId, updates) {
    await performanceService.updateGoal(goalId, updates);
    setGoals(await performanceService.getGoals(user.id, cycle.id));
  }

  async function handleSubmitSelf(e) {
    e.preventDefault();
    const updated = await performanceService.submitSelfReview(review.id, {
      selfRating,
      selfComments,
    });
    setReview(updated);
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Performance</h1>

      {!cycle ? (
        <p className="mt-8 text-muted font-bold">
          No active review cycle right now. Check back once your admin starts one.
        </p>
      ) : (
        <>
          <p className="text-muted font-bold mt-2">
            {cycle.name} · {cycle.startDate} to {cycle.endDate}
          </p>

          <h2 className="font-display font-bold text-xl mt-10 mb-4">My Goals</h2>
          <div className="space-y-4 max-w-2xl">
            {goals.map((goal) => (
              <GoalRow key={goal.id} goal={goal} editable onUpdate={handleGoalUpdate} />
            ))}
            <OutlinedCard className="p-5">
              <form onSubmit={handleAddGoal} className="space-y-3">
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="New goal title"
                  className={INPUT_CLASS}
                />
                <textarea
                  rows={2}
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Description"
                  className={`${INPUT_CLASS} resize-none`}
                />
                <CandyButton
                  type="submit"
                  variant="mustard"
                  small
                  disabled={!goalTitle.trim()}
                  className="rounded-full"
                >
                  + Add Goal
                </CandyButton>
              </form>
            </OutlinedCard>
          </div>

          <h2 className="font-display font-bold text-xl mt-10 mb-4">My Review</h2>
          <div className="max-w-2xl pb-10">
            {review.status === 'pending_self' ? (
              <OutlinedCard className="p-6">
                <p className="font-bold text-sm mb-4">Submit your self-review</p>
                <form onSubmit={handleSubmitSelf} className="space-y-4">
                  <div>
                    <label className="block font-bold text-sm mb-1.5">Rating (1–5)</label>
                    <select
                      value={selfRating}
                      onChange={(e) => setSelfRating(e.target.value)}
                      className={INPUT_CLASS}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-sm mb-1.5">Comments</label>
                    <textarea
                      rows={3}
                      value={selfComments}
                      onChange={(e) => setSelfComments(e.target.value)}
                      placeholder="How did this cycle go for you?"
                      className={`${INPUT_CLASS} resize-none`}
                    />
                  </div>
                  <CandyButton type="submit" variant="primary" className="w-full">
                    Submit Self-Review
                  </CandyButton>
                </form>
              </OutlinedCard>
            ) : (
              <ReviewCard title="Your Review" review={review} />
            )}
          </div>
        </>
      )}
    </CompanyAppShell>
  );
}
