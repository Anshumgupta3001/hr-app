import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { v4 as uuidv4 } from 'uuid';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { theme } from '../theme';

export default function CreateCompanyScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deptInput, setDeptInput] = useState('');
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      authService.getCurrentUser().then((current) => {
        if (!current) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        if (current.role !== 'superadmin') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard', params: { companyId: current.companyId } }],
          });
          return;
        }
        setUser(current);
      });
    }, [navigation])
  );

  function addDepartment() {
    const name = deptInput.trim();
    if (!name) return;
    if (departments.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      setDeptInput('');
      return;
    }
    // tempKey is a client-only React key for the unsaved chip — it is never
    // sent to the backend, which mints the real id once the company is created.
    setDepartments([...departments, { tempKey: uuidv4(), name }]);
    setDeptInput('');
  }

  function removeDepartment(tempKey) {
    setDepartments(departments.filter((d) => d.tempKey !== tempKey));
  }

  const canSave =
    companyName.trim() && adminName.trim() && adminEmail.trim() && adminPassword;

  async function handleSave() {
    if (!canSave || !user) return;
    setError('');
    try {
      await companyService.createCompany(
        { name: companyName, industry, departments, createdBy: user.id },
        { name: adminName, email: adminEmail, password: adminPassword }
      );
      navigation.navigate('SuperAdminDashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user) {
    return <SafeAreaView style={styles.screen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} navigation={navigation} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <OutlinedCard style={styles.cardWrap}>
            <BackButton />
            <Text style={styles.heading}>Create Company</Text>

            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Acme Rockets"
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.label}>Industry</Text>
            <TextInput
              style={styles.input}
              value={industry}
              onChangeText={setIndustry}
              placeholder="Aerospace"
              placeholderTextColor={theme.colors.muted}
            />

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Company Admin</Text>

            <Text style={styles.label}>Admin Name</Text>
            <TextInput
              style={styles.input}
              value={adminName}
              onChangeText={setAdminName}
              placeholder="Alex Rivera"
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.label}>Admin Email</Text>
            <TextInput
              style={styles.input}
              value={adminEmail}
              onChangeText={setAdminEmail}
              placeholder="alex@acme.com"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.label}>Admin Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={adminPassword}
                onChangeText={setAdminPassword}
                placeholder="Set their password"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword((v) => !v)}
              >
                <Text style={styles.passwordToggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.divider} />
            <Text style={styles.label}>
              Departments <Text style={styles.optional}>(optional)</Text>
            </Text>
            <View style={styles.deptRow}>
              <TextInput
                style={[styles.input, styles.deptInput]}
                value={deptInput}
                onChangeText={setDeptInput}
                placeholder="Engineering"
                placeholderTextColor={theme.colors.muted}
                onSubmitEditing={addDepartment}
                returnKeyType="done"
              />
              <CandyButton
                title="+ Add"
                variant="mustard"
                small
                pill
                onPress={addDepartment}
              />
            </View>
            {departments.length > 0 && (
              <View style={styles.chipWrap}>
                {departments.map((dept) => (
                  <View key={dept.tempKey} style={styles.chipOuter}>
                    <View style={styles.chipShadow} />
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{dept.name}</Text>
                      <Pressable
                        onPress={() => removeDepartment(dept.tempKey)}
                        hitSlop={8}
                        accessibilityLabel={`Remove ${dept.name}`}
                      >
                        <Text style={styles.chipRemove}>×</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <CandyButton
              title="Create Company"
              variant="primary"
              disabled={!canSave}
              onPress={handleSave}
              style={styles.submit}
            />
          </OutlinedCard>
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
    flexGrow: 1,
    padding: 24,
    paddingBottom: 48,
  },
  cardWrap: {
    width: '100%',
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 27,
    color: theme.colors.ink,
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
    marginBottom: 12,
  },
  divider: {
    borderTopWidth: 3,
    borderTopColor: 'rgba(51,47,58,0.08)',
    marginVertical: 16,
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    marginBottom: 6,
  },
  optional: {
    fontFamily: theme.fonts.body,
    color: 'rgba(23,20,13,0.5)',
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
    marginBottom: 16,
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 64,
  },
  passwordToggle: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  passwordToggleText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.teal,
    textDecorationLine: 'underline',
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  deptInput: {
    flex: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  chipOuter: {
    paddingRight: 5,
    paddingBottom: 5,
  },
  chipShadow: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderRadius: 999,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
  },
  chipRemove: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    lineHeight: 18,
    color: theme.colors.ink,
  },
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.coral,
    marginBottom: 12,
  },
  submit: {
    marginTop: 4,
  },
});
