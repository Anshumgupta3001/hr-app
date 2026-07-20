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
import { theme } from '../theme';

const DOCUMENT_SLOTS = [
  { documentType: 'aadhar', label: 'Aadhar Copy' },
  { documentType: 'pan', label: 'PAN Copy' },
  { documentType: 'passport', label: 'Passport Copy' },
  { documentType: 'bankProof', label: 'Bank Proof' },
];

export default function MyDocumentsScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);

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
        if (current.role === 'superadmin') {
          navigation.reset({ index: 0, routes: [{ name: 'SuperAdminDashboard' }] });
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (current.companyId !== targetId) {
          navigation.replace('MyDocuments', { companyId: current.companyId });
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId])
  );

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>My Documents</Text>
        <Text style={styles.subheading}>
          Upload and manage your profile photo and personal documents.
        </Text>

        <OutlinedCard style={styles.section} contentStyle={styles.sectionContent}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <ProfilePhotoUpload companyId={companyId} employeeId={user.id} />
        </OutlinedCard>

        <OutlinedCard style={styles.section} contentStyle={styles.sectionContent}>
          <Text style={styles.sectionTitle}>Documents</Text>
          <View style={styles.docGrid}>
            {DOCUMENT_SLOTS.map((slot) => (
              <DocumentUploadCard
                key={slot.documentType}
                companyId={companyId}
                employeeId={user.id}
                documentType={slot.documentType}
                label={slot.label}
                style={styles.docItem}
              />
            ))}
          </View>
        </OutlinedCard>

        <OutlinedCard style={styles.section} contentStyle={styles.sectionContent}>
          <Text style={styles.sectionTitle}>Other Documents</Text>
          <OtherDocumentsList companyId={companyId} employeeId={user.id} />
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
