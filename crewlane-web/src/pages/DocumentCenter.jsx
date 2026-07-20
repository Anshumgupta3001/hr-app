import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { documentService } from '../services/documentService.js';

const DOCUMENT_COLUMNS = [
  { documentType: 'profilePhoto', label: 'Profile Photo' },
  { documentType: 'aadhar', label: 'Aadhar' },
  { documentType: 'pan', label: 'PAN' },
  { documentType: 'passport', label: 'Passport' },
  { documentType: 'bankProof', label: 'Bank Proof' },
];

export default function DocumentCenter() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (!['admin', 'hr'].includes(current.role)) {
        navigate(
          current.role === 'superadmin' ? '/super-admin' : `/dashboard/${current.companyId}`,
          { replace: true }
        );
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/documents/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      const employees = await employeeService.getEmployeesByCompany(companyId);
      const withDocs = await Promise.all(
        employees.map(async (emp) => {
          const docs = await documentService.getDocumentsForEmployee(emp.id);
          const byType = new Set(docs.map((d) => d.documentType));
          const otherCount = docs.filter((d) => d.documentType === 'other').length;
          return { employee: emp, byType, otherCount };
        })
      );
      setUser(current);
      setCompany(found);
      setRows(withDocs);
    }
    load();
  }, [navigate, companyId]);

  if (!user || !company) return null;

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">Document Center</h1>
      <p className="text-sm text-muted mt-1">
        A quick overview of who's missing what. Click a row for the full view.
      </p>

      <OutlinedCard className="mt-8 p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink/10">
                <th className="text-left font-bold px-5 py-3 whitespace-nowrap">Employee</th>
                {DOCUMENT_COLUMNS.map((col) => (
                  <th key={col.documentType} className="font-bold px-4 py-3 whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
                <th className="font-bold px-4 py-3 whitespace-nowrap">Other</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={DOCUMENT_COLUMNS.length + 2}
                    className="px-5 py-6 text-center text-muted font-bold"
                  >
                    No employees yet.
                  </td>
                </tr>
              ) : (
                rows.map(({ employee, byType, otherCount }) => (
                  <tr
                    key={employee.id}
                    onClick={() =>
                      navigate(`/employees/${companyId}/documents/${employee.id}`)
                    }
                    className="border-b border-ink/5 last:border-b-0 cursor-pointer hover:bg-clay-input/50"
                  >
                    <td className="px-5 py-3 font-bold whitespace-nowrap">{employee.name}</td>
                    {DOCUMENT_COLUMNS.map((col) => (
                      <td key={col.documentType} className="px-4 py-3 text-center">
                        {byType.has(col.documentType) ? (
                          <span className="text-teal font-bold">✓</span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      {otherCount > 0 ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-violet/10 text-violet text-xs font-bold px-2 py-0.5 min-w-[1.5rem]">
                          {otherCount}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </OutlinedCard>
    </CompanyAppShell>
  );
}
