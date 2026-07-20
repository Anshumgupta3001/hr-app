import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import DocumentUploadCard from '../components/DocumentUploadCard';
import OtherDocumentsList from '../components/OtherDocumentsList';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { theme } from '../theme';

const DOCUMENT_SLOTS = [
  { documentType: 'aadhar', label: 'Aadhar Copy' },
  { documentType: 'pan', label: 'PAN Copy' },
  { documentType: 'passport', label: 'Passport Copy' },
  { documentType: 'bankProof', label: 'Bank Proof' },
];

export default function EmployeeDocumentsScreen({ navigation, route }) {
  const { companyId, employeeId } = route.params || {};
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employee, setEmployee] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const current = await authService.getCurrentUser();
        if (!active) return;
        if (!current) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        if (!['admin', 'hr'].includes(current.role)) {
          navigation.reset({
            index: 0,
            routes: [
              {
                name: current.role === 'superadmin' ? 'SuperAdminDashboard' : 'Dashboard',
              },
            ],
          });
          return;
        }
        if (current.companyId !== companyId) {
          navigation.replace('Employees', { companyId: current.companyId });
          return;
        }
        const found = await companyService.getCompanyById(companyId);
        const emp = await employeeService.getEmployeeById(employeeId);
        if (!active) return;
        if (!found || !emp || emp.companyId !== companyId) {
          navigation.replace('Employees', { companyId });
          return;
        }
        setUser(current);
        setCompany(found);
        setEmployee(emp);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, companyId, employeeId])
  );

  if (!user || !company || !employee) {
    return <SafeAreaView style={styles.screen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>
          {employee.name}
          <Text style={styles.headingMuted}> — Documents</Text>
        </Text>
        <Text style={styles.subheading}>
          View-only — uploads happen from their own profile.
        </Text>

        <OutlinedCard style={styles.section} contentStyle={styles.sectionContent}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <ProfilePhotoUpload companyId={companyId} employeeId={employeeId} readOnly />
        </OutlinedCard>

        <OutlinedCard style={styles.section} contentStyle={styles.sectionContent}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.docGrid}>
            {DOCUMENT_SLOTS.map((slot) => (
              <DocumentUploadCard
                key={slot.documentType}
                companyId={companyId}
                employeeId={employeeId}
                documentType={slot.documentType}
                label={slot.label}
                readOnly
                style={styles.docItem}
              />
            ))}
          </View>
        </OutlinedCard>

        <OutlinedCard style={styles.section} contentStyle={styles.sectionContent}>
          <Text style={styles.sectionTitle}>Other Documents</Text>
          <OtherDocumentsList companyId={companyId} employeeId={employeeId} readOnly />
        </OutlinedCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 26,
    color: theme.colors.ink,
  },
  headingMuted: {
    color: theme.colors.muted,
    fontSize: 20,
  },
  subheading: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
    marginBottom: 20,
  },
  section: {
    width: '100%',
    marginBottom: 16,
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
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  docItem: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});
