import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import EmployeeProfileForm from '../components/EmployeeProfileForm.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService, defaultProfileFields } from '../services/employeeService.js';

export default function MyProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [profile, setProfile] = useState(defaultProfileFields());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      const found = current.companyId
        ? await companyService.getCompanyById(current.companyId)
        : null;
      setUser(current);
      setCompany(found);
      setProfile({ ...defaultProfileFields(), ...current });
    }
    load();
  }, [navigate]);

  if (!user) return null;

  function departmentName(departmentId) {
    if (!company) return '—';
    const dept = company.departments.find((d) => d.id === departmentId);
    return dept ? dept.name : '—';
  }

  async function handleSave() {
    setSaved(false);
    const updated = await employeeService.updateEmployee(user.id, {
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
    setUser(updated);
    setSaved(true);
  }

  const content = (
    <div className="max-w-2xl space-y-6">
      <BackButton />
      <OutlinedCard className="p-6">
        <h1 className="font-display font-extrabold text-3xl mb-4">My Profile</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Name</p>
            <p className="font-bold mt-0.5">{user.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Email</p>
            <p className="font-bold mt-0.5">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              Department
            </p>
            <p className="font-bold mt-0.5">{departmentName(user.departmentId)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              Designation
            </p>
            <p className="font-bold mt-0.5">{user.designation || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">Role</p>
            <p className="font-bold mt-0.5 capitalize">{user.role}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              Probation Ends
            </p>
            <p className="font-bold mt-0.5">{user.probationEndDate || '—'}</p>
          </div>
        </div>
      </OutlinedCard>

      <EmployeeProfileForm
        profile={profile}
        onChange={setProfile}
        companyId={user.companyId}
        employeeId={user.id}
      />

      {saved && <p className="text-teal font-bold text-sm">Changes saved.</p>}
      <CandyButton variant="primary" onClick={handleSave} className="w-full">
        Save Changes
      </CandyButton>
    </div>
  );

  if (!user.companyId) {
    return (
      <div className="relative min-h-screen px-4 sm:px-8 py-10">
        <div className="max-w-2xl mx-auto">{content}</div>
      </div>
    );
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={user.companyId} calm>
      {content}
    </CompanyAppShell>
  );
}
