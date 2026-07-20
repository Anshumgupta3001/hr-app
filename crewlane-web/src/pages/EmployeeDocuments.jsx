import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import BackButton from '../components/BackButton.jsx';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload.jsx';
import DocumentUploadCard from '../components/DocumentUploadCard.jsx';
import OtherDocumentsList from '../components/OtherDocumentsList.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';

const DOCUMENT_SLOTS = [
  { documentType: 'aadhar', label: 'Aadhar Copy' },
  { documentType: 'pan', label: 'PAN Copy' },
  { documentType: 'passport', label: 'Passport Copy' },
  { documentType: 'bankProof', label: 'Bank Proof' },
];

export default function EmployeeDocuments() {
  const navigate = useNavigate();
  const { companyId, employeeId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employee, setEmployee] = useState(null);

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
        navigate(`/employees/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      const emp = await employeeService.getEmployeeById(employeeId);
      if (!found || !emp || emp.companyId !== companyId) {
        navigate(`/employees/${companyId}`, { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
      setEmployee(emp);
    }
    load();
  }, [navigate, companyId, employeeId]);

  if (!user || !company || !employee) return null;

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
        {employee.name}
        <span className="text-muted text-2xl"> — Documents</span>
      </h1>
      <p className="text-sm text-muted mt-1">View-only — uploads happen from their own profile.</p>

      <div className="max-w-2xl space-y-6 mt-8 pb-10">
        <OutlinedCard className="p-6">
          <h3 className="font-display font-extrabold text-lg mb-4">Profile Photo</h3>
          <ProfilePhotoUpload companyId={companyId} employeeId={employeeId} readOnly />
        </OutlinedCard>

        <OutlinedCard className="p-6">
          <h3 className="font-display font-extrabold text-lg mb-4">Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOCUMENT_SLOTS.map((slot) => (
              <DocumentUploadCard
                key={slot.documentType}
                companyId={companyId}
                employeeId={employeeId}
                documentType={slot.documentType}
                label={slot.label}
                readOnly
              />
            ))}
          </div>
        </OutlinedCard>

        <OutlinedCard className="p-6">
          <h3 className="font-display font-extrabold text-lg mb-4">Other Documents</h3>
          <OtherDocumentsList companyId={companyId} employeeId={employeeId} readOnly />
        </OutlinedCard>
      </div>
    </CompanyAppShell>
  );
}
