import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import PraiseCard from '../components/PraiseCard.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { praiseService } from '../services/praiseService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

const MAX_LENGTH = 200;

export default function PraiseWall() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [praises, setPraises] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [toEmployeeId, setToEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
        navigate(`/praise/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      const companyEmployees = await employeeService.getEmployeesByCompany(companyId);
      setUser(current);
      setCompany(found);
      setEmployees(companyEmployees);
      setPraises(await praiseService.getPraisesByCompany(companyId));
      setToEmployeeId(companyEmployees.find((e) => e.id !== current.id)?.id || '');
    }
    load();
  }, [navigate, companyId]);

  if (!user || !company) return null;

  function employeeName(id) {
    if (id === user.id) return user.name;
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : 'Former employee';
  }

  const recipients = employees.filter((e) => e.id !== user.id);
  const canSubmit = toEmployeeId && message.trim();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    try {
      await praiseService.createPraise({
        companyId,
        fromEmployeeId: user.id,
        toEmployeeId,
        message,
      });
      setMessage('');
      setShowForm(false);
      setPraises(await praiseService.getPraisesByCompany(companyId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Praise Wall</h1>
        {recipients.length > 0 && (
          <CandyButton variant="primary" onClick={() => setShowForm((v) => !v)}>
            + Give Praise
          </CandyButton>
        )}
      </div>

      {showForm && (
        <OutlinedCard className="p-6 mt-6 max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="toEmployee" className="block font-bold text-sm mb-1.5">
                Employee
              </label>
              <select
                id="toEmployee"
                value={toEmployeeId}
                onChange={(e) => setToEmployeeId(e.target.value)}
                className={INPUT_CLASS}
              >
                {recipients.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="message" className="block font-bold text-sm mb-1.5">
                Message
              </label>
              <textarea
                id="message"
                rows={3}
                maxLength={MAX_LENGTH}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Shout out something great they did"
                className={`${INPUT_CLASS} resize-none`}
              />
              <p className="text-xs text-muted mt-1 text-right">
                {message.length}/{MAX_LENGTH}
              </p>
            </div>
            {error && <p className="text-coral font-bold text-sm">{error}</p>}
            <CandyButton type="submit" variant="primary" disabled={!canSubmit} className="w-full">
              Send Praise
            </CandyButton>
          </form>
        </OutlinedCard>
      )}

      <div className="mt-8 space-y-4 pb-10">
        {praises.length === 0 ? (
          <p className="text-muted font-bold">No praise given yet — be the first.</p>
        ) : (
          praises.map((praise) => (
            <PraiseCard
              key={praise.id}
              praise={praise}
              fromName={employeeName(praise.fromEmployeeId)}
              toName={employeeName(praise.toEmployeeId)}
            />
          ))
        )}
      </div>
    </CompanyAppShell>
  );
}
