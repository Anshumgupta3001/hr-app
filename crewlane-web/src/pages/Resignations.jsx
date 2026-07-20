import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { resignationService } from '../services/resignationService.js';

export default function Resignations() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [ackIds, setAckIds] = useState([]);

  const loadResignations = useCallback(async () => {
    setResignations(await resignationService.getByCompany(companyId));
  }, [companyId]);

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
        navigate(`/resignations/${current.companyId}`, { replace: true });
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
      await loadResignations();
    }
    load();
  }, [navigate, companyId, loadResignations]);

  if (!user || !company) return null;

  function employeeName(employeeId) {
    if (employeeId === user.id) return user.name;
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  async function handleAcknowledge(id) {
    setAckIds((ids) => [...ids, id]);
    await resignationService.acknowledgeResignation(id);
    await loadResignations();
    setEmployees(await employeeService.getEmployeesByCompany(companyId));
    setAckIds((ids) => ids.filter((i) => i !== id));
  }

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Resignations</h1>

      {resignations.length === 0 ? (
        <p className="mt-10 text-muted font-bold">No resignation requests.</p>
      ) : (
        <div className="space-y-4 mt-8 max-w-2xl pb-10">
          {resignations.map((r) => {
            const acking = ackIds.includes(r.id);
            return (
              <OutlinedCard key={r.id} className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-lg">
                      {employeeName(r.employeeId)}
                    </p>
                    <p className="text-sm text-muted mt-0.5">
                      Proposed last working day: {r.proposedLastWorkingDay}
                    </p>
                    {r.reason && (
                      <p className="text-sm text-muted mt-1 italic">“{r.reason}”</p>
                    )}
                    <p className="text-xs text-muted mt-1">
                      Submitted {new Date(r.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white shadow-clayButton ${
                        r.status === 'pending' ? 'bg-mustard' : 'bg-teal'
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.status === 'pending' && (
                      <CandyButton
                        variant="teal"
                        small
                        disabled={acking}
                        onClick={() => handleAcknowledge(r.id)}
                      >
                        Acknowledge
                      </CandyButton>
                    )}
                  </div>
                </div>
              </OutlinedCard>
            );
          })}
        </div>
      )}
    </CompanyAppShell>
  );
}
