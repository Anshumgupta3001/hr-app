import OutlinedCard from './OutlinedCard.jsx';
import ProfilePhotoUpload from './ProfilePhotoUpload.jsx';
import DocumentUploadCard from './DocumentUploadCard.jsx';
import OtherDocumentsList from './OtherDocumentsList.jsx';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-3 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

function Section({ title, children }) {
  return (
    <OutlinedCard className="p-6">
      <h3 className="font-display font-extrabold text-lg mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </OutlinedCard>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-bold text-sm mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const DOCUMENT_SLOTS = [
  { documentType: 'aadhar', label: 'Aadhar Copy' },
  { documentType: 'pan', label: 'PAN Copy' },
  { documentType: 'passport', label: 'Passport Copy' },
  { documentType: 'bankProof', label: 'Bank Proof' },
];

export default function EmployeeProfileForm({ profile, onChange, companyId, employeeId }) {
  function set(field, value) {
    onChange({ ...profile, [field]: value });
  }

  function setBank(field, value) {
    onChange({
      ...profile,
      bankDetails: { ...profile.bankDetails, [field]: value },
    });
  }

  const bank = profile.bankDetails || {};

  return (
    <div className="space-y-6">
      <Section title="Personal Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date of Birth">
            <input
              type="date"
              value={profile.dateOfBirth || ''}
              onChange={(e) => set('dateOfBirth', e.target.value || null)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Date of Joining">
            <input
              type="date"
              value={profile.dateOfJoining || ''}
              onChange={(e) => set('dateOfJoining', e.target.value || null)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </Section>

      <Section title="Work Experience">
        <Field label="Previous Company Name">
          <input
            type="text"
            value={profile.previousCompanyName || ''}
            onChange={(e) => set('previousCompanyName', e.target.value)}
            placeholder="Acme Corp"
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Total Years of Experience">
          <input
            type="number"
            min="0"
            step="0.5"
            value={profile.totalExperienceYears ?? ''}
            onChange={(e) =>
              set('totalExperienceYears', e.target.value === '' ? null : Number(e.target.value))
            }
            placeholder="3.5"
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Previous Role / Notes">
          <textarea
            rows={3}
            value={profile.previousRoleNotes || ''}
            onChange={(e) => set('previousRoleNotes', e.target.value)}
            placeholder="Optional notes about their previous role"
            className={`${INPUT_CLASS} resize-none`}
          />
        </Field>
      </Section>

      <Section title="Bank Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Account Holder Name">
            <input
              type="text"
              value={bank.accountHolderName || ''}
              onChange={(e) => setBank('accountHolderName', e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Bank Account Number">
            <input
              type="text"
              value={bank.accountNumber || ''}
              onChange={(e) => setBank('accountNumber', e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="IFSC Code">
            <input
              type="text"
              value={bank.ifscCode || ''}
              onChange={(e) => setBank('ifscCode', e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Bank Name">
            <input
              type="text"
              value={bank.bankName || ''}
              onChange={(e) => setBank('bankName', e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </Section>

      <Section title="Government ID">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Aadhar Number">
            <input
              type="text"
              value={profile.aadharNumber || ''}
              onChange={(e) => set('aadharNumber', e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="PAN Number">
            <input
              type="text"
              value={profile.panNumber || ''}
              onChange={(e) => set('panNumber', e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Passport Number">
            <input
              type="text"
              value={profile.passportNumber || ''}
              onChange={(e) => set('passportNumber', e.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
      </Section>

      {employeeId ? (
        <>
          <Section title="Profile Photo">
            <ProfilePhotoUpload companyId={companyId} employeeId={employeeId} />
          </Section>

          <Section title="Documents">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOCUMENT_SLOTS.map((slot) => (
                <DocumentUploadCard
                  key={slot.documentType}
                  companyId={companyId}
                  employeeId={employeeId}
                  documentType={slot.documentType}
                  label={slot.label}
                />
              ))}
            </div>
          </Section>

          <Section title="Other Documents">
            <OtherDocumentsList companyId={companyId} employeeId={employeeId} />
          </Section>
        </>
      ) : (
        <Section title="Documents">
          <p className="text-sm text-muted">
            Save this employee first — documents and a profile photo can be added once their
            record exists.
          </p>
        </Section>
      )}
    </div>
  );
}
