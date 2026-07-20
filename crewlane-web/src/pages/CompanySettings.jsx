import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function CompanySettings() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

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
        navigate(`/settings/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      setName(found.name);
      setIndustry(found.industry);
      setDepartments(found.departments);
    }
    load();
  }, [navigate, companyId]);

  function addDepartment() {
    const deptName = deptInput.trim();
    if (!deptName) return;
    if (departments.some((d) => d.name.toLowerCase() === deptName.toLowerCase())) {
      setDeptInput('');
      return;
    }
    // tempKey is a client-only React key for the unsaved chip — it is never
    // sent to the backend, which mints the real id once it's saved.
    setDepartments([...departments, { tempKey: uuidv4(), name: deptName }]);
    setDeptInput('');
  }

  function removeDepartment(key) {
    setDepartments(departments.filter((d) => (d.id || d.tempKey) !== key));
  }

  const canSave = name.trim().length > 0;

  async function handleSave(e) {
    e.preventDefault();
    if (!canSave) return;
    setError('');
    setSaved(false);
    try {
      const updated = await companyService.updateCompany(companyId, {
        name,
        industry,
        departments,
      });
      setCompany(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user || !company) return null;

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <OutlinedCard className="p-8 max-w-xl">
        <h1 className="font-display font-extrabold text-3xl mb-6">Company Settings</h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="name" className="block font-bold text-sm mb-1.5">
              Company name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="industry" className="block font-bold text-sm mb-1.5">
              Industry
            </label>
            <input
              id="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="deptInput" className="block font-bold text-sm mb-1.5">
              Departments
            </label>
            <div className="flex gap-3">
              <input
                id="deptInput"
                type="text"
                value={deptInput}
                onChange={(e) => setDeptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDepartment();
                  }
                }}
                placeholder="Engineering"
                className={INPUT_CLASS}
              />
              <CandyButton
                type="button"
                variant="mustard"
                small
                className="rounded-full whitespace-nowrap"
                onClick={addDepartment}
              >
                + Add
              </CandyButton>
            </div>
            {departments.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {departments.map((dept) => (
                  <span
                    key={dept.id || dept.tempKey}
                    className="inline-flex items-center gap-2 rounded-full bg-white shadow-clayCard px-4 py-1.5 font-bold text-sm"
                  >
                    {dept.name}
                    <button
                      type="button"
                      aria-label={`Remove ${dept.name}`}
                      onClick={() => removeDepartment(dept.id || dept.tempKey)}
                      className="text-ink font-bold text-base leading-none hover:text-coral"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-coral font-bold text-sm">{error}</p>}
          {saved && <p className="text-teal font-bold text-sm">Changes saved.</p>}
          <CandyButton
            type="submit"
            variant="primary"
            disabled={!canSave}
            className="w-full mt-2"
          >
            Save changes
          </CandyButton>
        </form>
      </OutlinedCard>
    </CompanyAppShell>
  );
}
