import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
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

export default function MyDepartment() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [colleagues, setColleagues] = useState([]);

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
        navigate(`/my-department/${current.companyId}`, { replace: true });
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
      setColleagues(
        current.departmentId
          ? companyEmployees.filter((e) => e.departmentId === current.departmentId)
          : []
      );
    }
    load();
  }, [navigate, companyId]);

  if (!user || !company) return null;

  const department = company.departments.find((d) => d.id === user.departmentId);

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      {!user.departmentId ? (
        <OutlinedCard className="p-8 max-w-xl">
          <h1 className="font-display font-extrabold text-3xl mb-2">My Department</h1>
          <p className="text-muted">
            You haven't been assigned to a department yet — check with your admin.
          </p>
        </OutlinedCard>
      ) : (
        <>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
            {department ? department.name : 'Unassigned'}
          </h1>
          <p className="text-muted font-bold mt-2">
            {colleagues.length} {colleagues.length === 1 ? 'person' : 'people'} in this
            department
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8 pb-10">
            {colleagues.map((emp, i) => (
              <OutlinedCard key={emp.id} className="p-6 flex flex-col">
                <div className="flex items-start gap-3">
                  <Avatar
                    employeeId={emp.id}
                    name={emp.name}
                    className="w-11 h-11 rounded-full shadow-clayButton"
                    accentClassName={AVATAR_ACCENTS[i % AVATAR_ACCENTS.length]}
                    textClassName="text-lg"
                  />
                  <div className="min-w-0">
                    <p className="font-display font-bold text-lg leading-tight truncate">
                      {emp.name}
                      {emp.id === user.id && (
                        <span className="text-muted font-body text-sm font-bold"> (You)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted truncate">{emp.designation || '—'}</p>
                  </div>
                </div>
                <span
                  className={`self-start rounded-full px-3 py-0.5 text-xs font-bold uppercase mt-3 ${ROLE_STYLES[emp.role] || 'bg-white'}`}
                >
                  {emp.role}
                </span>
              </OutlinedCard>
            ))}
          </div>
        </>
      )}
    </CompanyAppShell>
  );
}
