import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import Avatar from '../components/Avatar.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';

const ROLE_STYLES = {
  admin: 'bg-violet text-white',
  hr: 'bg-sky text-white',
  manager: 'bg-coral text-white',
  employee: 'bg-teal text-white',
};

const AVATAR_ACCENTS = [
  'bg-gradient-to-br from-blue-400 to-blue-600',
  'bg-gradient-to-br from-purple-400 to-purple-600',
  'bg-gradient-to-br from-pink-400 to-pink-600',
  'bg-gradient-to-br from-emerald-400 to-emerald-600',
];

export default function Employees() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);

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
      setEmployees(await employeeService.getEmployeesByCompany(companyId));
    }
    load();
  }, [navigate, companyId]);

  async function handleRemove(id) {
    await employeeService.removeEmployee(id);
    setEmployees(await employeeService.getEmployeesByCompany(companyId));
  }

  if (!user || !company) return null;

  const canManage = ['admin', 'hr'].includes(user.role);

  function departmentName(departmentId) {
    const dept = company.departments.find((d) => d.id === departmentId);
    return dept ? dept.name : '—';
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
          Employees{' '}
          <span className="text-muted text-2xl">({employees.length})</span>
        </h1>
        {canManage && (
          <CandyButton
            variant="primary"
            onClick={() => navigate(`/employees/${companyId}/add`)}
          >
            + Add Employee
          </CandyButton>
        )}
      </div>

      {employees.length === 0 ? (
        <p className="mt-10 text-muted font-bold">
          No employees yet{canManage ? ' — add the first one.' : '.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8 pb-10">
          {employees.map((emp, i) => (
            <OutlinedCard key={emp.id} className="p-6 flex flex-col">
              <div className="flex items-start gap-3">
                <Avatar
                  employeeId={emp.id}
                  name={emp.name}
                  className={`w-11 h-11 rounded-full shadow-clayButton`}
                  accentClassName={AVATAR_ACCENTS[i % AVATAR_ACCENTS.length]}
                  textClassName="text-lg"
                />
                <div className="min-w-0">
                  <p className="font-display font-bold text-lg leading-tight truncate">
                    {emp.name}
                  </p>
                  <p className="text-xs text-muted truncate">{emp.designation || '—'}</p>
                </div>
              </div>
              <p className="text-sm mt-3 truncate">{emp.email}</p>
              <p className="text-sm text-muted mt-1">Dept: {departmentName(emp.departmentId)}</p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase ${ROLE_STYLES[emp.role] || 'bg-white'}`}
                >
                  {emp.role}
                </span>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                    emp.status === 'active' ? 'bg-teal text-white' : 'bg-coral text-white'
                  }`}
                >
                  {emp.status}
                </span>
              </div>
              {canManage && (
                <div className="flex gap-3 mt-5 flex-wrap">
                  <CandyButton
                    variant="secondary"
                    small
                    onClick={() => navigate(`/employees/${companyId}/edit/${emp.id}`)}
                  >
                    Edit
                  </CandyButton>
                  <CandyButton
                    variant="secondary"
                    small
                    onClick={() => navigate(`/employees/${companyId}/checklist/${emp.id}`)}
                  >
                    Checklist
                  </CandyButton>
                  <CandyButton
                    variant="secondary"
                    small
                    onClick={() => navigate(`/employees/${companyId}/documents/${emp.id}`)}
                  >
                    View Documents
                  </CandyButton>
                  {emp.id !== user.id && (
                    <CandyButton
                      variant="primary"
                      small
                      onClick={() => handleRemove(emp.id)}
                    >
                      Remove
                    </CandyButton>
                  )}
                </div>
              )}
            </OutlinedCard>
          ))}
        </div>
      )}
    </CompanyAppShell>
  );
}
