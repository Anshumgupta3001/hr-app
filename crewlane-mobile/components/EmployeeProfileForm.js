import { View, Text, TextInput, StyleSheet } from 'react-native';
import OutlinedCard from './OutlinedCard';
import ProfilePhotoUpload from './ProfilePhotoUpload';
import DocumentUploadCard from './DocumentUploadCard';
import OtherDocumentsList from './OtherDocumentsList';
import { theme } from '../theme';

const DOCUMENT_SLOTS = [
  { documentType: 'aadhar', label: 'Aadhar Copy' },
  { documentType: 'pan', label: 'PAN Copy' },
  { documentType: 'passport', label: 'Passport Copy' },
  { documentType: 'bankProof', label: 'Bank Proof' },
];

function Section({ title, children }) {
  return (
    <OutlinedCard style={styles.section} contentStyle={styles.sectionContent}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </OutlinedCard>
  );
}

function Field({ label, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

export default function EmployeeProfileForm({ profile, onChange, companyId, employeeId }) {
  function set(field, value) {
    onChange({ ...profile, [field]: value });
  }

  function setBank(field, value) {
    onChange({ ...profile, bankDetails: { ...profile.bankDetails, [field]: value } });
  }

  const bank = profile.bankDetails || {};

  return (
    <View style={styles.wrap}>
      <Section title="Personal Details">
        <Field label="Date of Birth (YYYY-MM-DD)">
          <TextInput
            style={styles.input}
            value={profile.dateOfBirth || ''}
            onChangeText={(v) => set('dateOfBirth', v || null)}
            placeholder="1995-06-12"
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="none"
          />
        </Field>
        <Field label="Date of Joining (YYYY-MM-DD)">
          <TextInput
            style={styles.input}
            value={profile.dateOfJoining || ''}
            onChangeText={(v) => set('dateOfJoining', v || null)}
            placeholder="2023-01-15"
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="none"
          />
        </Field>
      </Section>

      <Section title="Work Experience">
        <Field label="Previous Company Name">
          <TextInput
            style={styles.input}
            value={profile.previousCompanyName || ''}
            onChangeText={(v) => set('previousCompanyName', v)}
            placeholder="Acme Corp"
            placeholderTextColor={theme.colors.muted}
          />
        </Field>
        <Field label="Total Years of Experience">
          <TextInput
            style={styles.input}
            value={profile.totalExperienceYears == null ? '' : String(profile.totalExperienceYears)}
            onChangeText={(v) => set('totalExperienceYears', v === '' ? null : Number(v))}
            placeholder="3.5"
            placeholderTextColor={theme.colors.muted}
            keyboardType="decimal-pad"
          />
        </Field>
        <Field label="Previous Role / Notes">
          <TextInput
            style={[styles.input, styles.textarea]}
            value={profile.previousRoleNotes || ''}
            onChangeText={(v) => set('previousRoleNotes', v)}
            placeholder="Optional notes about their previous role"
            placeholderTextColor={theme.colors.muted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </Field>
      </Section>

      <Section title="Bank Details">
        <Field label="Account Holder Name">
          <TextInput
            style={styles.input}
            value={bank.accountHolderName || ''}
            onChangeText={(v) => setBank('accountHolderName', v)}
            placeholderTextColor={theme.colors.muted}
          />
        </Field>
        <Field label="Bank Account Number">
          <TextInput
            style={styles.input}
            value={bank.accountNumber || ''}
            onChangeText={(v) => setBank('accountNumber', v)}
            placeholderTextColor={theme.colors.muted}
          />
        </Field>
        <Field label="IFSC Code">
          <TextInput
            style={styles.input}
            value={bank.ifscCode || ''}
            onChangeText={(v) => setBank('ifscCode', v)}
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="characters"
          />
        </Field>
        <Field label="Bank Name">
          <TextInput
            style={styles.input}
            value={bank.bankName || ''}
            onChangeText={(v) => setBank('bankName', v)}
            placeholderTextColor={theme.colors.muted}
          />
        </Field>
      </Section>

      <Section title="Government ID">
        <Field label="Aadhar Number">
          <TextInput
            style={styles.input}
            value={profile.aadharNumber || ''}
            onChangeText={(v) => set('aadharNumber', v)}
            placeholderTextColor={theme.colors.muted}
          />
        </Field>
        <Field label="PAN Number">
          <TextInput
            style={styles.input}
            value={profile.panNumber || ''}
            onChangeText={(v) => set('panNumber', v)}
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="characters"
          />
        </Field>
        <Field label="Passport Number">
          <TextInput
            style={styles.input}
            value={profile.passportNumber || ''}
            onChangeText={(v) => set('passportNumber', v)}
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="characters"
          />
        </Field>
      </Section>

      {employeeId ? (
        <>
          <Section title="Profile Photo">
            <ProfilePhotoUpload companyId={companyId} employeeId={employeeId} />
          </Section>

          <Section title="Documents">
            <View style={styles.docGrid}>
              {DOCUMENT_SLOTS.map((slot) => (
                <DocumentUploadCard
                  key={slot.documentType}
                  companyId={companyId}
                  employeeId={employeeId}
                  documentType={slot.documentType}
                  label={slot.label}
                  style={styles.docItem}
                />
              ))}
            </View>
          </Section>

          <Section title="Other Documents">
            <OtherDocumentsList companyId={companyId} employeeId={employeeId} />
          </Section>
        </>
      ) : (
        <Section title="Documents">
          <Text style={styles.emptyText}>
            Save this employee first — documents and a profile photo can be added once their
            record exists.
          </Text>
        </Section>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 16,
  },
  section: {
    width: '100%',
  },
  sectionContent: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 17,
    color: theme.colors.ink,
    marginBottom: 14,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    marginBottom: 6,
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
  },
  textarea: {
    minHeight: 80,
  },
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  docItem: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
  },
});
