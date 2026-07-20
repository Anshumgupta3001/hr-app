import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import ReviewCard from '../components/ReviewCard.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { performanceService } from '../services/performanceService.js';

export default function TeamReviews() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loaded, setLoaded] = useState(false);

  const loadReviews = useCallback(async (activeCycle, directReports, cId) => {
    const map = {};
    for (const report of directReports) {
      map[report.id] = await performanceService.getOrCreateReview(
        cId,
        activeCycle.id,
        report.id
      );
    }
    setReviews(map);
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
        navigate(`/team-reviews/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      const employees = await employeeService.getEmployeesByCompany(companyId);
      const directReports = employees.filter((e) => e.managerId === current.id);
      if (directReports.length === 0) {
        navigate(`/dashboard/${companyId}`, { replace: true });
        return;
      }
      const activeCycle = await performanceService.getActiveCycle(companyId);
      setUser(current);
      setCompany(found);
      setReports(directReports);
      setCycle(activeCycle);
      if (activeCycle) {
        await loadReviews(activeCycle, directReports, companyId);
      }
      setLoaded(true);
    }
    load();
  }, [navigate, companyId, loadReviews]);

  if (!user || !company || !loaded) return null;

  async function handleSubmitManager(reviewId, data) {
    await performanceService.submitManagerReview(reviewId, data);
    await loadReviews(cycle, reports, companyId);
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Team Reviews</h1>

      {!cycle ? (
        <p className="mt-8 text-muted font-bold">No active review cycle right now.</p>
      ) : (
        <>
          <p className="text-muted font-bold mt-2">
            {cycle.name} · {reports.length} direct report{reports.length === 1 ? '' : 's'}
          </p>
          <div className="space-y-4 mt-8 max-w-2xl pb-10">
            {reports.map((report) =>
              reviews[report.id] ? (
                <ReviewCard
                  key={report.id}
                  title={report.name}
                  review={reviews[report.id]}
                  showManagerForm
                  onSubmitManager={handleSubmitManager}
                />
              ) : null
            )}
          </div>
        </>
      )}
    </CompanyAppShell>
  );
}
