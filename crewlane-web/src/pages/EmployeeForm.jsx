import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import EmployeeProfileForm from '../components/EmployeeProfileForm.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService, defaultProfileFields } from '../services/employeeService.js';
import { checklistService } from '../services/checklistService.js';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

const BASE_ROLE_OPTIONS = ['hr', 'manager', 'employee'];

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { companyId, employeeId } = useParams();
  const isEdit = Boolean(employeeId);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('employee');
  const [initialRole, setInitialRole] = useState('employee');
  const [adminConfirm, setAdminConfirm] = useState(false);
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('');
  const [status, setStatus] = useState('active');
  const [profile, setProfile] = useState(defaultProfileFields());
  const [managerId, setManagerId] = useState('');
  const [probationEndDate, setProbationEndDate] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('active');
  const [colleagues, setColleagues] = useState([]);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (!['admin', 'hr'].includes(current.role)) {
        navigate(
          current.role === 'superadmin' ? '/super-admin' : `/employees/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/employees/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      const companyEmployees = await employeeService.getEmployeesByCompany(companyId);
      setColleagues(companyEmployees.filter((e) => e.id !== employeeId));
      if (employeeId) {
        const emp = await employeeService.getEmployeeById(employeeId);
        if (!emp || emp.companyId !== companyId) {
          navigate(`/employees/${companyId}`, { replace: true });
          return;
        }
        setName(emp.name);
        setEmail(emp.email);
        setPassword(emp.password);
        setRole(emp.role);
        setInitialRole(emp.role);
        setDepartmentId(emp.departmentId || '');
        setDesignation(emp.designation);
        setStatus(emp.status);
        setManagerId(emp.managerId || '');
        setProbationEndDate(emp.probationEndDate || '');
        setEmploymentStatus(emp.employmentStatus || 'active');
        setProfile({ ...defaultProfileFields(), ...emp });
      }
    }
    load();
  }, [navigate, companyId, employeeId]);

  if (!user || !company) return null;

  const roleOptions =
    user.role === 'admin' ? [...BASE_ROLE_OPTIONS, 'admin'] : BASE_ROLE_OPTIONS;
  const canSave = name.trim() && email.trim() && password;
  const isPromotingToAdmin = role === 'admin' && initialRole !== 'admin';

  async function handleSave(e) {
    e.preventDefault();
    if (!canSave) return;
    if (isPromotingToAdmin && !adminConfirm) {
      setAdminConfirm(true);
      return;
    }
    await performSave();
  }

  async function performSave() {
    setError('');
    try {
      if (isEdit) {
        await employeeService.updateEmployee(employeeId, {
          name: name.trim(),
          email,
          password,
          role,
          departmentId: departmentId || null,
          designation: designation.trim(),
          status,
          managerId: managerId || null,
          probationEndDate: probationEndDate || null,
          dateOfBirth: profile.dateOfBirth,
          dateOfJoining: profile.dateOfJoining,
          previousCompanyName: profile.previousCompanyName,
          totalExperienceYears: profile.totalExperienceYears,
          previousRoleNotes: profile.previousRoleNotes,
          bankDetails: profile.bankDetails,
          aadharNumber: profile.aadharNumber,
          panNumber: profile.panNumber,
          passportNumber: profile.passportNumber,
        });
      } else {
        const created = await employeeService.createEmployee({
          companyId,
          name,
          email,
          password,
          role,
          departmentId: departmentId || null,
          designation,
          managerId: managerId || null,
          probationEndDate: probationEndDate || null,
          profile,
        });
        await checklistService.seedOnboarding(companyId, created.id);
      }
      navigate(`/employees/${companyId}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <OutlinedCard className="p-8 max-w-xl">
        <h1 className="font-display font-extrabold text-3xl mb-6">
          {isEdit ? 'Edit Employee' : 'Add Employee'}
        </h1>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="name" className="block font-bold text-sm mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Lee"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="email" className="block font-bold text-sm mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@company.com"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="password" className="block font-bold text-sm mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
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
          <div>
            <label htmlFor="role" className="block font-bold text-sm mb-1.5">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setAdminConfirm(false);
              }}
              className={INPUT_CLASS}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="department" className="block font-bold text-sm mb-1.5">
              Department
            </label>
            <select
              id="department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">None</option>
              {company.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="designation" className="block font-bold text-sm mb-1.5">
              Designation
            </label>
            <input
              id="designation"
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Product Designer"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="managerId" className="block font-bold text-sm mb-1.5">
              Reports To
            </label>
            <select
              id="managerId"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">No one / Reports directly to Admin</option>
              {colleagues.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="probationEndDate" className="block font-bold text-sm mb-1.5">
              Probation End Date
            </label>
            <input
              id="probationEndDate"
              type="date"
              value={probationEndDate}
              onChange={(e) => setProbationEndDate(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          {isEdit && (
            <div>
              <label htmlFor="status" className="block font-bold text-sm mb-1.5">
                Status
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
          {error && <p className="text-coral font-bold text-sm">{error}</p>}

          {adminConfirm ? (
            <div className="rounded-card bg-clay-input p-5 space-y-3">
              <p className="font-bold text-sm">
                Give {name || 'this person'} full Admin access to {company.name}? They&rsquo;ll be
                able to manage all employees, leave policy, and company settings.
              </p>
              <div className="flex gap-3">
                <CandyButton type="submit" variant="primary" small>
                  Confirm
                </CandyButton>
                <CandyButton
                  type="button"
                  variant="secondary"
                  small
                  onClick={() => {
                    setAdminConfirm(false);
                    setRole(initialRole);
                  }}
                >
                  Cancel
                </CandyButton>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <CandyButton type="submit" variant="primary" disabled={!canSave} className="flex-1">
                {isEdit ? 'Save changes' : 'Add Employee'}
              </CandyButton>
              <CandyButton
                type="button"
                variant="secondary"
                onClick={() => navigate(`/employees/${companyId}`)}
              >
                Cancel
              </CandyButton>
            </div>
          )}
        </form>
      </OutlinedCard>

      <div className="max-w-xl mt-6">
        <EmployeeProfileForm
          profile={profile}
          onChange={setProfile}
          companyId={companyId}
          employeeId={isEdit ? employeeId : null}
        />
      </div>

      {isEdit && user.role === 'admin' && employmentStatus !== 'exited' && (
        <OutlinedCard className="p-6 max-w-xl mt-6 mb-10">
          <p className="font-display font-bold text-lg">Mark as Exited</p>
          <p className="text-sm text-muted mt-1">
            This deactivates their login, seeds the offboarding checklist, and flags their
            assigned assets for return. It cannot be undone here.
          </p>
          {employmentStatus === 'on_notice' && (
            <span className="inline-block rounded-full bg-mustard text-white px-3 py-1 text-xs font-bold mt-3 shadow-clayButton">
              Currently on notice
            </span>
          )}
          <div className="flex gap-3 mt-4">
            {!exitConfirm ? (
              <CandyButton variant="secondary" onClick={() => setExitConfirm(true)}>
                Mark as Exited
              </CandyButton>
            ) : (
              <>
                <CandyButton
                  variant="primary"
                  onClick={async () => {
                    await employeeService.updateEmployee(employeeId, {
                      employmentStatus: 'exited',
                    });
                    await checklistService.seedOffboarding(companyId, employeeId);
                    navigate(`/employees/${companyId}`);
                  }}
                >
                  Confirm Exit
                </CandyButton>
                <CandyButton variant="secondary" onClick={() => setExitConfirm(false)}>
                  Cancel
                </CandyButton>
              </>
            )}
          </div>
        </OutlinedCard>
      )}
      {isEdit && employmentStatus === 'exited' && (
        <OutlinedCard className="p-6 max-w-xl mt-6 mb-10">
          <span className="inline-block rounded-full bg-coral text-white px-3 py-1 text-xs font-bold shadow-clayButton">
            Exited
          </span>
          <p className="text-sm text-muted mt-2">
            This employee has exited the company. Their login is disabled.
          </p>
        </OutlinedCard>
      )}
    </CompanyAppShell>
  );
}
