import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import SuperAdminAppShell from '../components/SuperAdminAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

export default function CreateCompany() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deptInput, setDeptInput] = useState('');
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    authService.getCurrentUser().then((current) => {
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (current.role !== 'superadmin') {
        navigate(`/dashboard/${current.companyId}`, { replace: true });
        return;
      }
      setUser(current);
    });
  }, [navigate]);

  function addDepartment() {
    const name = deptInput.trim();
    if (!name) return;
    if (departments.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      setDeptInput('');
      return;
    }
    // tempKey is a client-only React key for the unsaved chip — it is never
    // sent to the backend, which mints the real id once the company is created.
    setDepartments([...departments, { tempKey: uuidv4(), name }]);
    setDeptInput('');
  }

  function removeDepartment(tempKey) {
    setDepartments(departments.filter((d) => d.tempKey !== tempKey));
  }

  const canSave =
    companyName.trim() && adminName.trim() && adminEmail.trim() && adminPassword;

  async function handleSave(e) {
    e.preventDefault();
    if (!canSave || !user) return;
    setError('');
    try {
      await companyService.createCompany(
        {
          name: companyName,
          industry,
          departments,
          createdBy: user.id,
        },
        {
          name: adminName,
          email: adminEmail,
          password: adminPassword,
        }
      );
      navigate('/super-admin');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) return null;

  return (
    <SuperAdminAppShell user={user} calm>
      <BackButton className="mb-4" />
      <OutlinedCard className="p-8 max-w-xl">
        <h1 className="font-display font-extrabold text-3xl mb-6">Create Company</h1>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="companyName" className="block font-bold text-sm mb-1.5">
                  Company Name
                </label>
                <input
                  id="companyName"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Rockets"
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
                  placeholder="Aerospace"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="pt-4 border-t-2 border-ink/5">
                <p className="font-display font-bold text-lg mb-3">Company Admin</p>
              </div>
              <div>
                <label htmlFor="adminName" className="block font-bold text-sm mb-1.5">
                  Admin Name
                </label>
                <input
                  id="adminName"
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Alex Rivera"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="adminEmail" className="block font-bold text-sm mb-1.5">
                  Admin Email
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="alex@acme.com"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="adminPassword" className="block font-bold text-sm mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <input
                    id="adminPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Set their password"
                    className={`${INPUT_CLASS} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-xs underline decoration-2 decoration-teal"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-ink/5">
                <label htmlFor="deptInput" className="block font-bold text-sm mb-1.5">
                  Departments <span className="font-normal text-muted">(optional)</span>
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
                        key={dept.tempKey}
                        className="inline-flex items-center gap-2 rounded-full bg-white shadow-clayCard px-4 py-1.5 font-bold text-sm"
                      >
                        {dept.name}
                        <button
                          type="button"
                          aria-label={`Remove ${dept.name}`}
                          onClick={() => removeDepartment(dept.tempKey)}
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
              <CandyButton
                type="submit"
                variant="primary"
                disabled={!canSave}
                className="w-full mt-2"
              >
                Create Company
              </CandyButton>
            </form>
      </OutlinedCard>
    </SuperAdminAppShell>
  );
}
