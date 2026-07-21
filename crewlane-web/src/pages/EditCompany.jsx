import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import SuperAdminAppShell from '../components/SuperAdminAppShell.jsx';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { leavePolicyService } from '../services/leavePolicyService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

function AdminsSection({ companyId, admins, onReload }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const canAdd = name.trim() && email.trim() && password;

  async function handleAdd(e) {
    e.preventDefault();
    if (!canAdd) return;
    setSaving(true);
    setError('');
    try {
      await companyService.addAdmin(companyId, { name: name.trim(), email, password });
      setName('');
      setEmail('');
      setPassword('');
      setShowForm(false);
      await onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(employeeId) {
    setRemoveError('');
    setRemovingId(employeeId);
    try {
      await companyService.removeAdmin(companyId, employeeId);
      await onReload();
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <OutlinedCard className="p-8 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h2 className="font-display font-bold text-xl">Admins</h2>
        <CandyButton
          type="button"
          variant="mustard"
          small
          className="rounded-full"
          onClick={() => setShowForm((v) => !v)}
        >
          + Add Admin
        </CandyButton>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="space-y-4 mb-6 bg-clay-input rounded-card p-5">
          <div>
            <label className="block font-bold text-sm mb-1.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Rivera"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block font-bold text-sm mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          {error && <p className="text-coral font-bold text-sm">{error}</p>}
          <CandyButton type="submit" variant="primary" small disabled={!canAdd || saving}>
            Save Admin
          </CandyButton>
        </form>
      )}

      {removeError && <p className="text-coral font-bold text-sm mb-4">{removeError}</p>}

      {admins.length === 0 ? (
        <p className="text-muted font-bold">No admins yet.</p>
      ) : (
        <div className="space-y-3">
          {admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between gap-4 bg-clay-input rounded-btn px-5 py-4"
            >
              <div>
                <p className="font-display font-bold">{admin.name}</p>
                <p className="text-xs text-muted mt-0.5">{admin.email}</p>
              </div>
              <CandyButton
                variant="primary"
                small
                disabled={removingId === admin.id}
                onClick={() => handleRemove(admin.id)}
              >
                Remove Admin
              </CandyButton>
            </div>
          ))}
        </div>
      )}
    </OutlinedCard>
  );
}

export default function EditCompany() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [departments, setDepartments] = useState([]);
  const [leaveRows, setLeaveRows] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  async function loadAdmins() {
    setAdmins(await companyService.getAdmins(companyId));
  }

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (current.role !== 'superadmin') {
        navigate(`/dashboard/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/super-admin', { replace: true });
        return;
      }
      const policy = await leavePolicyService.getCompanyPolicy(companyId);
      setUser(current);
      setCompany(found);
      setName(found.name);
      setIndustry(found.industry);
      setDepartments(found.departments);
      setLeaveRows(policy.leaveTypes.map((t) => ({ ...t })));
      setAdmins(await companyService.getAdmins(companyId));
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
    setSaved(false);
  }

  function removeDepartment(key) {
    setDepartments(departments.filter((d) => (d.id || d.tempKey) !== key));
    setSaved(false);
  }

  function updateLeaveRow(key, field, value) {
    setLeaveRows(
      leaveRows.map((r) => ((r.id || r.tempKey) === key ? { ...r, [field]: value } : r))
    );
    setSaved(false);
  }

  function removeLeaveRow(key) {
    setLeaveRows(leaveRows.filter((r) => (r.id || r.tempKey) !== key));
    setSaved(false);
  }

  function addLeaveRow() {
    // tempKey is a client-only React key for the unsaved row — it is never
    // sent to the backend, which mints the real id once it's saved.
    setLeaveRows([...leaveRows, { tempKey: uuidv4(), name: '', annualQuota: 0 }]);
    setSaved(false);
  }

  const canSave = name.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    setError('');
    setSaved(false);
    try {
      const updatedCompany = await companyService.updateCompany(companyId, {
        name,
        industry,
        departments,
      });
      const updatedPolicy = await leavePolicyService.updateCompanyPolicy(companyId, leaveRows);
      setCompany(updatedCompany);
      setLeaveRows(updatedPolicy.leaveTypes.map((t) => ({ ...t })));
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user || !company) return null;

  return (
    <SuperAdminAppShell user={user} calm>
      <BackButton className="mb-4" />
      <OutlinedCard className="p-8 max-w-2xl">
        <h1 className="font-display font-extrabold text-3xl mb-1">Edit Company</h1>
        <p className="text-sm text-muted mb-6">{company.name}</p>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block font-bold text-sm mb-1.5">
              Company name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
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
              onChange={(e) => {
                setIndustry(e.target.value);
                setSaved(false);
              }}
              className={INPUT_CLASS}
            />
          </div>

          <div className="pt-4 border-t-2 border-ink/5">
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

          <div className="pt-4 border-t-2 border-ink/5">
            <p className="font-display font-bold text-lg mb-3">Leave Policy</p>
            <div className="space-y-3">
              <div className="flex gap-3 text-xs font-bold uppercase tracking-widest text-muted">
                <span className="flex-1">Leave Type</span>
                <span className="w-24">Quota / yr</span>
                <span className="w-6" />
              </div>
              {leaveRows.map((row) => (
                <div key={row.id || row.tempKey} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) =>
                      updateLeaveRow(row.id || row.tempKey, 'name', e.target.value)
                    }
                    placeholder="Leave type name"
                    className={`${INPUT_CLASS} flex-1`}
                  />
                  <input
                    type="number"
                    min="0"
                    value={row.annualQuota}
                    onChange={(e) =>
                      updateLeaveRow(row.id || row.tempKey, 'annualQuota', e.target.value)
                    }
                    className={`${INPUT_CLASS} w-24`}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${row.name || 'row'}`}
                    onClick={() => removeLeaveRow(row.id || row.tempKey)}
                    className="w-6 font-bold text-lg hover:text-coral"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <CandyButton
                variant="mustard"
                small
                className="rounded-full"
                onClick={addLeaveRow}
              >
                + Add Leave Type
              </CandyButton>
            </div>
          </div>

          {error && <p className="text-coral font-bold text-sm">{error}</p>}
          {saved && <p className="text-teal font-bold text-sm">Changes saved.</p>}
          <CandyButton
            variant="primary"
            disabled={!canSave}
            onClick={handleSave}
            className="w-full mt-2"
          >
            Save Changes
          </CandyButton>
        </div>
      </OutlinedCard>

      <div className="mt-6">
        <AdminsSection companyId={companyId} admins={admins} onReload={loadAdmins} />
      </div>
    </SuperAdminAppShell>
  );
}
