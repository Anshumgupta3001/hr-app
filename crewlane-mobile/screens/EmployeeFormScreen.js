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
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import EmployeeProfileForm from '../components/EmployeeProfileForm';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService, defaultProfileFields } from '../services/employeeService';
import { checklistService } from '../services/checklistService';
import { theme } from '../theme';

function OptionPills({ options, value, onChange, labelFor = (v) => v }) {
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={String(opt)}
            onPress={() => onChange(opt)}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
              {labelFor(opt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function EmployeeFormScreen({ navigation, route }) {
  const employeeId = route.params?.employeeId || null;
  const isEdit = Boolean(employeeId);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('employee');
  const [initialRole, setInitialRole] = useState('employee');
  const [adminConfirm, setAdminConfirm] = useState(false);
  const [departmentId, setDepartmentId] = useState(null);
  const [designation, setDesignation] = useState('');
  const [status, setStatus] = useState('active');
  const [profile, setProfile] = useState(defaultProfileFields());
  const [managerId, setManagerId] = useState(null);
  const [probationEndDate, setProbationEndDate] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('active');
  const [colleagues, setColleagues] = useState([]);
  const [exitConfirm, setExitConfirm] = useState(false);
  const [error, setError] = useState('');
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
        if (!['admin', 'hr'].includes(current.role)) {
          navigation.goBack();
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (!targetId || current.companyId !== targetId) {
          navigation.goBack();
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.goBack();
          return;
        }
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        const companyEmployees = await employeeService.getEmployeesByCompany(targetId);
        if (!active) return;
        setColleagues(companyEmployees.filter((e) => e.id !== employeeId));
        if (employeeId && !loaded) {
          const emp = await employeeService.getEmployeeById(employeeId);
          if (!active) return;
          if (!emp || emp.companyId !== targetId) {
            navigation.goBack();
            return;
          }
          setName(emp.name);
          setEmail(emp.email);
          setPassword(emp.password);
          setRole(emp.role);
          setInitialRole(emp.role);
          setDepartmentId(emp.departmentId);
          setDesignation(emp.designation);
          setStatus(emp.status);
          setManagerId(emp.managerId || null);
          setProbationEndDate(emp.probationEndDate || '');
          setEmploymentStatus(emp.employmentStatus || 'active');
          setProfile({ ...defaultProfileFields(), ...emp });
        }
        setLoaded(true);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, employeeId, loaded])
  );

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  const roleOptions =
    user.role === 'admin' ? ['hr', 'manager', 'employee', 'admin'] : ['hr', 'manager', 'employee'];

  const canSave = name.trim() && email.trim() && password;
  const isPromotingToAdmin = role === 'admin' && initialRole !== 'admin';

  async function handleSave() {
    if (!canSave) return;
    if (isPromotingToAdmin && !adminConfirm) {
      setAdminConfirm(true);
      return;
    }
    await performSave();
  }

  async function performSave() {
    setError('');
    try {
      if (isEdit) {
        await employeeService.updateEmployee(employeeId, {
          name: name.trim(),
          email,
          password,
          role,
          departmentId,
          designation: designation.trim(),
          status,
          managerId: managerId || null,
          probationEndDate: probationEndDate || null,
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
      } else {
        const created = await employeeService.createEmployee({
          companyId,
          name,
          email,
          password,
          role,
          departmentId,
          designation,
          managerId: managerId || null,
          probationEndDate: probationEndDate || null,
          profile,
        });
        await checklistService.seedOnboarding(companyId, created.id);
      }
      navigation.navigate('Employees', { companyId });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar
        user={user}
        company={company}
        companyId={companyId}
        navigation={navigation}
        active="Employees"
      />
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
            <Text style={styles.heading}>{isEdit ? 'Edit Employee' : 'Add Employee'}</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Jordan Lee"
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="jordan@company.com"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
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

            <Text style={styles.label}>Role</Text>
            <OptionPills
              options={roleOptions}
              value={role}
              onChange={(r) => {
                setRole(r);
                setAdminConfirm(false);
              }}
              labelFor={(r) => r.charAt(0).toUpperCase() + r.slice(1)}
            />

            <Text style={styles.label}>Department</Text>
            <OptionPills
              options={[null, ...company.departments.map((d) => d.id)]}
              value={departmentId}
              onChange={setDepartmentId}
              labelFor={(id) =>
                id === null
                  ? 'None'
                  : company.departments.find((d) => d.id === id)?.name || '—'
              }
            />

            <Text style={styles.label}>Designation</Text>
            <TextInput
              style={styles.input}
              value={designation}
              onChangeText={setDesignation}
              placeholder="Product Designer"
              placeholderTextColor={theme.colors.muted}
            />

            <Text style={styles.label}>Reports To</Text>
            <OptionPills
              options={[null, ...colleagues.map((c) => c.id)]}
              value={managerId}
              onChange={setManagerId}
              labelFor={(id) =>
                id === null
                  ? 'No one / Admin'
                  : colleagues.find((c) => c.id === id)?.name || '—'
              }
            />

            <Text style={styles.label}>Probation End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={probationEndDate}
              onChangeText={setProbationEndDate}
              placeholder="2026-10-01"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
            />

            {isEdit && (
              <>
                <Text style={styles.label}>Status</Text>
                <OptionPills
                  options={['active', 'inactive']}
                  value={status}
                  onChange={setStatus}
                  labelFor={(s) => s.charAt(0).toUpperCase() + s.slice(1)}
                />
              </>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {adminConfirm ? (
              <View style={styles.adminConfirmBox}>
                <Text style={styles.adminConfirmText}>
                  Give {name || 'this person'} full Admin access to {company.name}? They&rsquo;ll
                  be able to manage all employees, leave policy, and company settings.
                </Text>
                <View style={styles.adminConfirmActions}>
                  <CandyButton
                    title="Confirm"
                    variant="primary"
                    small
                    onPress={handleSave}
                  />
                  <CandyButton
                    title="Cancel"
                    variant="secondary"
                    small
                    onPress={() => {
                      setAdminConfirm(false);
                      setRole(initialRole);
                    }}
                  />
                </View>
              </View>
            ) : (
              <>
                <CandyButton
                  title={isEdit ? 'Save changes' : 'Add Employee'}
                  variant="primary"
                  disabled={!canSave}
                  onPress={handleSave}
                  style={styles.submit}
                />
                <CandyButton
                  title="Cancel"
                  variant="secondary"
                  onPress={() => navigation.navigate('Employees', { companyId })}
                />
              </>
            )}
          </OutlinedCard>

          <View style={styles.profileFormWrap}>
            <EmployeeProfileForm
              profile={profile}
              onChange={setProfile}
              companyId={companyId}
              employeeId={isEdit ? employeeId : null}
            />
          </View>

          {isEdit && user.role === 'admin' && employmentStatus !== 'exited' && (
            <OutlinedCard style={styles.exitCard} contentStyle={styles.exitContent}>
              <Text style={styles.exitTitle}>Mark as Exited</Text>
              <Text style={styles.exitBody}>
                This deactivates their login, seeds the offboarding checklist, and flags
                their assigned assets for return. It cannot be undone here.
              </Text>
              {employmentStatus === 'on_notice' && (
                <View style={styles.noticePill}>
                  <Text style={styles.noticePillText}>Currently on notice</Text>
                </View>
              )}
              <View style={styles.exitActions}>
                {!exitConfirm ? (
                  <CandyButton
                    title="Mark as Exited"
                    variant="secondary"
                    small
                    pill
                    onPress={() => setExitConfirm(true)}
                  />
                ) : (
                  <>
                    <CandyButton
                      title="Confirm Exit"
                      variant="primary"
                      small
                      pill
                      onPress={async () => {
                        await employeeService.updateEmployee(employeeId, {
                          employmentStatus: 'exited',
                        });
                        await checklistService.seedOffboarding(companyId, employeeId);
                        navigation.navigate('Employees', { companyId });
                      }}
                    />
                    <CandyButton
                      title="Cancel"
                      variant="secondary"
                      small
                      pill
                      onPress={() => setExitConfirm(false)}
                    />
                  </>
                )}
              </View>
            </OutlinedCard>
          )}
          {isEdit && employmentStatus === 'exited' && (
            <OutlinedCard style={styles.exitCard} contentStyle={styles.exitContent}>
              <View style={styles.exitedPill}>
                <Text style={styles.noticePillText}>Exited</Text>
              </View>
              <Text style={styles.exitBody}>
                This employee has exited the company. Their login is disabled.
              </Text>
            </OutlinedCard>
          )}
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
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillSelected: {
    backgroundColor: theme.colors.violet,
  },
  pillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
  },
  pillTextSelected: {
    color: theme.colors.white,
  },
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.coral,
    marginBottom: 12,
  },
  adminConfirmBox: {
    backgroundColor: theme.colors.inputFill,
    borderRadius: theme.radius.card,
    padding: 16,
  },
  adminConfirmText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    lineHeight: 19,
    marginBottom: 14,
  },
  adminConfirmActions: {
    flexDirection: 'row',
    gap: 10,
  },
  submit: {
    marginTop: 4,
    marginBottom: 4,
  },
  profileFormWrap: {
    marginTop: 16,
  },
  exitCard: {
    marginTop: 16,
  },
  exitContent: {
    padding: 20,
  },
  exitTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
  },
  exitBody: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 19,
    marginTop: 6,
  },
  noticePill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: theme.colors.mustard,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 10,
    ...theme.clayShadowButton,
  },
  exitedPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: theme.colors.coral,
    paddingHorizontal: 12,
    paddingVertical: 4,
    ...theme.clayShadowButton,
  },
  noticePillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.white,
  },
  exitActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
});
