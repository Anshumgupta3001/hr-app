import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import EmployeeProfileForm from '../components/EmployeeProfileForm';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService, defaultProfileFields } from '../services/employeeService';
import { theme } from '../theme';

export default function MyProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [profile, setProfile] = useState(defaultProfileFields());
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

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
        const found = current.companyId
          ? await companyService.getCompanyById(current.companyId)
          : null;
        if (!active) return;
        setUser(current);
        setCompany(found);
        if (!loaded) {
          setProfile({ ...defaultProfileFields(), ...current });
          setLoaded(true);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, loaded])
  );

  if (!user) {
    return <SafeAreaView style={styles.screen} />;
  }

  function departmentName(departmentId) {
    if (!company) return '—';
    const dept = company.departments.find((d) => d.id === departmentId);
    return dept ? dept.name : '—';
  }

  async function handleSave() {
    setSaved(false);
    const updated = await employeeService.updateEmployee(user.id, {
      dateOfBirth: profile.dateOfBirth,
      dateOfJoining: profile.dateOfJoining,
      previousCompanyName: profile.previousCompanyName,
      totalExperienceYears: profile.totalExperienceYears,
      previousRoleNotes: profile.previousRoleNotes,
      bankDetails: profile.bankDetails,
      aadharNumber: profile.aadharNumber,
      panNumber: profile.panNumber,
      passportNumber: profile.passportNumber,
    });
    setUser(updated);
    setSaved(true);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={user.companyId} navigation={navigation} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <BackButton />
          <OutlinedCard style={styles.headerCard} contentStyle={styles.headerContent}>
            <Text style={styles.heading}>My Profile</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>NAME</Text>
                <Text style={styles.infoValue}>{user.name}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>EMAIL</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DEPARTMENT</Text>
                <Text style={styles.infoValue}>{departmentName(user.departmentId)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DESIGNATION</Text>
                <Text style={styles.infoValue}>{user.designation || '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ROLE</Text>
                <Text style={[styles.infoValue, styles.capitalize]}>{user.role}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>PROBATION ENDS</Text>
                <Text style={styles.infoValue}>{user.probationEndDate || '—'}</Text>
              </View>
            </View>
          </OutlinedCard>

          <View style={styles.formSpacing}>
            <EmployeeProfileForm
              profile={profile}
              onChange={setProfile}
              companyId={user.companyId}
              employeeId={user.id}
            />
          </View>

          {saved ? <Text style={styles.saved}>Changes saved.</Text> : null}
          <CandyButton
            title="Save Changes"
            variant="primary"
            onPress={handleSave}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerContent: {
    padding: 20,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 26,
    color: theme.colors.ink,
    marginBottom: 14,
  },
  infoGrid: {
    gap: 10,
  },
  infoItem: {},
  infoLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: theme.colors.muted,
  },
  infoValue: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    marginTop: 2,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  formSpacing: {
    marginBottom: 16,
  },
  saved: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.teal,
    marginBottom: 12,
  },
  submit: {
    marginTop: 4,
  },
});
