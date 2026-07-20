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

const DOCUMENT_SLOTS = [
  { documentType: 'aadhar', label: 'Aadhar Copy' },
  { documentType: 'pan', label: 'PAN Copy' },
  { documentType: 'passport', label: 'Passport Copy' },
  { documentType: 'bankProof', label: 'Bank Proof' },
];

export default function MyDocuments() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);

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
        navigate(`/my-documents/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      setUser(current);
      setCompany(found);
    }
    load();
  }, [navigate, companyId]);

  if (!user || !company) return null;

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId} calm>
      <BackButton className="mb-4" />
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">My Documents</h1>
      <p className="text-sm text-muted mt-1">
        Upload and manage your profile photo and personal documents.
      </p>

      <div className="max-w-2xl space-y-6 mt-8 pb-10">
        <OutlinedCard className="p-6">
          <h3 className="font-display font-extrabold text-lg mb-4">Profile Photo</h3>
          <ProfilePhotoUpload companyId={companyId} employeeId={user.id} />
        </OutlinedCard>

        <OutlinedCard className="p-6">
          <h3 className="font-display font-extrabold text-lg mb-4">Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOCUMENT_SLOTS.map((slot) => (
              <DocumentUploadCard
                key={slot.documentType}
                companyId={companyId}
                employeeId={user.id}
                documentType={slot.documentType}
                label={slot.label}
              />
            ))}
          </div>
        </OutlinedCard>

        <OutlinedCard className="p-6">
          <h3 className="font-display font-extrabold text-lg mb-4">Other Documents</h3>
          <OtherDocumentsList companyId={companyId} employeeId={user.id} />
        </OutlinedCard>
      </div>
    </CompanyAppShell>
  );
}
