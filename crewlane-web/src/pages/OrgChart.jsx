import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import OrgChartNode from '../components/OrgChartNode.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';

export function buildOrgTree(employees) {
  const admin = employees.find((e) => e.role === 'admin') || null;
  const validIds = new Set(employees.map((e) => e.id));
  const childrenByManager = {};

  for (const employee of employees) {
    if (admin && employee.id === admin.id) continue;
    let parentId =
      employee.managerId && validIds.has(employee.managerId) && employee.managerId !== employee.id
        ? employee.managerId
        : admin
          ? admin.id
          : 'root';
    (childrenByManager[parentId] ||= []).push(employee);
  }

  if (admin) {
    const reachable = new Set([admin.id]);
    const queue = [admin.id];
    while (queue.length) {
      const id = queue.shift();
      for (const child of childrenByManager[id] || []) {
        if (!reachable.has(child.id)) {
          reachable.add(child.id);
          queue.push(child.id);
        }
      }
    }
    for (const employee of employees) {
      if (!reachable.has(employee.id)) {
        const list = childrenByManager[employee.managerId] || [];
        childrenByManager[employee.managerId] = list.filter((e) => e.id !== employee.id);
        (childrenByManager[admin.id] ||= []).push(employee);
        reachable.add(employee.id);
      }
    }
  }

  return { admin, childrenByManager };
}

export default function OrgChart() {
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
        navigate(`/org-chart/${current.companyId}`, { replace: true });
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

  if (!user || !company) return null;

  const { admin, childrenByManager } = buildOrgTree(employees);

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl mb-8">Org Chart</h1>
      <div className="max-w-2xl pb-10">
        {admin ? (
          <OrgChartNode employee={admin} childrenByManager={childrenByManager} />
        ) : employees.length === 0 ? (
          <p className="text-muted font-bold">No employees yet.</p>
        ) : (
          employees.map((emp) => (
            <OrgChartNode key={emp.id} employee={emp} childrenByManager={{}} />
          ))
        )}
      </div>
    </CompanyAppShell>
  );
}
