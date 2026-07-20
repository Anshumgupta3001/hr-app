import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminAppShell from '../components/SuperAdminAppShell.jsx';
import CandyButton from '../components/CandyButton.jsx';
import CompanyCard from '../components/CompanyCard.jsx';
import OutlinedCard from '../components/OutlinedCard.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';

function DeleteCompanyDialog({ company, onCancel, onConfirm }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const canConfirm = typed.trim() === company.name && !deleting;

  async function handleConfirm() {
    if (!canConfirm) return;
    setDeleting(true);
    await onConfirm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-ink/40">
      <OutlinedCard className="p-8 w-full max-w-md bg-white">
        <h2 className="font-display font-extrabold text-2xl mb-2">Delete company</h2>
        <p className="text-sm text-muted mb-4">
          This permanently deletes <span className="font-bold text-ink">{company.name}</span>
          {' '}— every employee, leave policy, leave request, and notification tied to it.
          This cannot be undone.
        </p>
        <label htmlFor="confirmName" className="block font-bold text-sm mb-1.5">
          Type <span className="font-black">{company.name}</span> to confirm
        </label>
        <input
          id="confirmName"
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20"
        />
        <div className="flex gap-3 mt-6">
          <CandyButton variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </CandyButton>
          <CandyButton
            variant="primary"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="flex-1"
          >
            {deleting ? 'Deleting…' : 'Delete company'}
          </CandyButton>
        </div>
      </OutlinedCard>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function loadCompanies() {
    setCompanies(await companyService.getAllCompanies());
    setEmployees(await employeeService.getAllEmployees());
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
      setUser(current);
      await loadCompanies();
    }
    load();
  }, [navigate]);

  if (!user) return null;

  async function handleDeleteConfirm() {
    await companyService.deleteCompany(deleteTarget.id);
    setDeleteTarget(null);
    await loadCompanies();
  }

  return (
    <SuperAdminAppShell user={user}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Companies</h1>
        <CandyButton
          variant="primary"
          onClick={() => navigate('/super-admin/create-company')}
        >
          + Create Company
        </CandyButton>
      </div>

      {companies.length === 0 ? (
        <p className="mt-10 text-muted font-bold">
          No companies yet. Create the first one to get started.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8 pb-10">
          {companies.map((company) => {
            const companyEmployees = employees.filter(
              (e) => e.companyId === company.id && e.role !== 'superadmin'
            );
            const admin = companyEmployees.find((e) => e.role === 'admin') || null;
            return (
              <CompanyCard
                key={company.id}
                company={company}
                employeeCount={companyEmployees.length}
                admin={admin}
                onEdit={() => navigate(`/super-admin/edit-company/${company.id}`)}
                onDelete={() => setDeleteTarget(company)}
              />
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <DeleteCompanyDialog
          company={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </SuperAdminAppShell>
  );
}
