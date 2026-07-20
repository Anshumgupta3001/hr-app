import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { holidayService } from '../services/holidayService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function HolidayCalendar() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  async function loadHolidays() {
    setHolidays(await holidayService.getHolidaysByCompany(companyId));
  }

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
        navigate(`/holidays/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      await loadHolidays();
    }
    load();
  }, [navigate, companyId]);

  if (!user || !company) return null;

  const canAdd = name.trim() && date;

  async function handleAdd(e) {
    e.preventDefault();
    if (!canAdd) return;
    setError('');
    try {
      await holidayService.createHoliday({ companyId, name, date });
      setName('');
      setDate('');
      await loadHolidays();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(id) {
    await holidayService.removeHoliday(id);
    await loadHolidays();
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <div className="max-w-2xl space-y-6">
        <BackButton />
        <OutlinedCard className="p-8">
          <h1 className="font-display font-extrabold text-3xl mb-6">Holidays</h1>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label htmlFor="holidayName" className="block font-bold text-sm mb-1.5">
                Name
              </label>
              <input
                id="holidayName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Independence Day"
                className={INPUT_CLASS}
              />
            </div>
            <div className="w-full sm:w-48">
              <label htmlFor="holidayDate" className="block font-bold text-sm mb-1.5">
                Date
              </label>
              <input
                id="holidayDate"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <CandyButton
              type="submit"
              variant="mustard"
              disabled={!canAdd}
              className="rounded-full whitespace-nowrap"
            >
              + Add Holiday
            </CandyButton>
          </form>
          {error && <p className="text-coral font-bold text-sm mt-4">{error}</p>}
        </OutlinedCard>

        {holidays.length === 0 ? (
          <p className="text-muted font-bold">No holidays declared yet.</p>
        ) : (
          <div className="space-y-3">
            {holidays.map((h) => (
              <OutlinedCard key={h.id} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-display font-bold text-lg">{h.name}</p>
                  <p className="text-sm text-muted">
                    {new Date(`${h.date}T00:00:00`).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <CandyButton variant="primary" small onClick={() => handleRemove(h.id)}>
                  Remove
                </CandyButton>
              </OutlinedCard>
            ))}
          </div>
        )}
      </div>
    </CompanyAppShell>
  );
}
