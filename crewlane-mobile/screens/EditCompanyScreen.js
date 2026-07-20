import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
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
import { leavePolicyService } from '../services/leavePolicyService';
import { theme } from '../theme';

export default function EditCompanyScreen({ navigation, route }) {
  const companyId = route.params?.companyId;
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [departments, setDepartments] = useState([]);
  const [leaveRows, setLeaveRows] = useState([]);
  const [error, setError] = useState('');
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
        if (current.role !== 'superadmin') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard', params: { companyId: current.companyId } }],
          });
          return;
        }
        const found = await companyService.getCompanyById(companyId);
        if (!active) return;
        if (!found) {
          navigation.reset({ index: 0, routes: [{ name: 'SuperAdminDashboard' }] });
          return;
        }
        setUser(current);
        setCompany(found);
        if (!loaded) {
          const policy = await leavePolicyService.getCompanyPolicy(companyId);
          if (!active) return;
          setName(found.name);
          setIndustry(found.industry);
          setDepartments(found.departments);
          setLeaveRows(policy.leaveTypes.map((t) => ({ ...t })));
          setLoaded(true);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, companyId, loaded])
  );

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  function addDepartment() {
    const deptName = deptInput.trim();
    if (!deptName) return;
    if (departments.some((d) => d.name.toLowerCase() === deptName.toLowerCase())) {
      setDeptInput('');
      return;
    }
    // tempKey is a client-only React key for the unsaved chip — it is never
    // sent to the backend, which mints the real id once it's saved.
    setDepartments((prev) => [...prev, { tempKey: uuidv4(), name: deptName }]);
    setSaved(false);
  }

  function removeDepartment(key) {
    setDepartments((prev) => prev.filter((d) => (d.id || d.tempKey) !== key));
    setSaved(false);
  }

  function updateLeaveRow(key, field, value) {
    setLeaveRows((prev) =>
      prev.map((r) => ((r.id || r.tempKey) === key ? { ...r, [field]: value } : r))
    );
    setSaved(false);
  }

  function removeLeaveRow(key) {
    setLeaveRows((prev) => prev.filter((r) => (r.id || r.tempKey) !== key));
    setSaved(false);
  }

  function addLeaveRow() {
    // tempKey is a client-only React key for the unsaved row — it is never
    // sent to the backend, which mints the real id once it's saved.
    setLeaveRows((prev) => [...prev, { tempKey: uuidv4(), name: '', annualQuota: 0 }]);
    setSaved(false);
  }

  const canSave = name.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    setError('');
    setSaved(false);
    try {
      const updatedCompany = await companyService.updateCompany(companyId, {
        name,
        industry,
        departments,
      });
      const updatedPolicy = await leavePolicyService.updateCompanyPolicy(companyId, leaveRows);
      setCompany(updatedCompany);
      setLeaveRows(updatedPolicy.leaveTypes.map((t) => ({ ...t })));
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
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
            <Text style={styles.heading}>Edit Company</Text>
            <Text style={styles.subheading}>{company.name}</Text>

            <Text style={styles.label}>Company name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(v) => {
                setName(v);
                setSaved(false);
              }}
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.label}>Industry</Text>
            <TextInput
              style={styles.input}
              value={industry}
              onChangeText={(v) => {
                setIndustry(v);
                setSaved(false);
              }}
              placeholderTextColor={theme.colors.muted}
            />

            <View style={styles.divider} />
            <Text style={styles.label}>Departments</Text>
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
              <CandyButton title="+ Add" variant="mustard" small pill onPress={addDepartment} />
            </View>
            {departments.length > 0 && (
              <View style={styles.chipWrap}>
                {departments.map((dept) => (
                  <View key={dept.id || dept.tempKey} style={styles.chip}>
                    <Text style={styles.chipText}>{dept.name}</Text>
                    <Pressable
                      onPress={() => removeDepartment(dept.id || dept.tempKey)}
                      hitSlop={8}
                      accessibilityLabel={`Remove ${dept.name}`}
                    >
                      <Text style={styles.chipRemove}>×</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Leave Policy</Text>
            {leaveRows.map((row) => (
              <View key={row.id || row.tempKey} style={styles.leaveRow}>
                <TextInput
                  style={[styles.input, styles.leaveNameInput]}
                  value={row.name}
                  onChangeText={(v) => updateLeaveRow(row.id || row.tempKey, 'name', v)}
                  placeholder="Leave type name"
                  placeholderTextColor={theme.colors.muted}
                />
                <TextInput
                  style={[styles.input, styles.leaveQuotaInput]}
                  value={String(row.annualQuota)}
                  onChangeText={(v) => updateLeaveRow(row.id || row.tempKey, 'annualQuota', v)}
                  keyboardType="number-pad"
                />
                <Pressable
                  onPress={() => removeLeaveRow(row.id || row.tempKey)}
                  hitSlop={8}
                  accessibilityLabel={`Remove ${row.name || 'row'}`}
                >
                  <Text style={styles.leaveRemove}>×</Text>
                </Pressable>
              </View>
            ))}
            <CandyButton
              title="+ Add Leave Type"
              variant="mustard"
              small
              pill
              onPress={addLeaveRow}
              style={styles.addLeaveButton}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {saved ? <Text style={styles.saved}>Changes saved.</Text> : null}
            <CandyButton
              title="Save Changes"
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
  },
  subheading: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
    marginBottom: 12,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(51,47,58,0.08)',
    marginVertical: 16,
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
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
    ...theme.clayShadowButton,
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
  leaveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  leaveNameInput: {
    flex: 1,
    marginBottom: 0,
  },
  leaveQuotaInput: {
    width: 70,
    textAlign: 'center',
    marginBottom: 0,
  },
  leaveRemove: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 20,
    color: theme.colors.ink,
  },
  addLeaveButton: {
    marginTop: 4,
    marginBottom: 16,
  },
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.coral,
    marginBottom: 12,
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
