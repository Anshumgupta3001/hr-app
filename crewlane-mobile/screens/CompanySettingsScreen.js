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

export default function CompanySettingsScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [deptInput, setDeptInput] = useState('');
  const [departments, setDepartments] = useState([]);
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
        if (current.role !== 'admin') {
          navigation.reset({
            index: 0,
            routes: [
              current.role === 'superadmin'
                ? { name: 'SuperAdminDashboard' }
                : { name: 'Dashboard', params: { companyId: current.companyId } },
            ],
          });
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (!targetId || current.companyId !== targetId) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'CompanySettings', params: { companyId: current.companyId } }],
          });
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
        if (!loaded) {
          setName(found.name);
          setIndustry(found.industry);
          setDepartments(found.departments);
          setLoaded(true);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, loaded])
  );

  function addDepartment() {
    const deptName = deptInput.trim();
    if (!deptName) return;
    if (departments.some((d) => d.name.toLowerCase() === deptName.toLowerCase())) {
      setDeptInput('');
      return;
    }
    // tempKey is a client-only React key for the unsaved chip — it is never
    // sent to the backend, which mints the real id once it's saved.
    setDepartments([...departments, { tempKey: uuidv4(), name: deptName }]);
    setDeptInput('');
  }

  function removeDepartment(key) {
    setDepartments(departments.filter((d) => (d.id || d.tempKey) !== key));
  }

  const canSave = name.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    setError('');
    setSaved(false);
    try {
      const updated = await companyService.updateCompany(companyId, {
        name,
        industry,
        departments,
      });
      setCompany(updated);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar
        user={user}
        company={company}
        companyId={companyId}
        navigation={navigation}
        active="CompanySettings"
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
            <Text style={styles.heading}>Company Settings</Text>

            <Text style={styles.label}>Company name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.label}>Industry</Text>
            <TextInput
              style={styles.input}
              value={industry}
              onChangeText={setIndustry}
              placeholderTextColor={theme.colors.muted}
            />

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
                  <View key={dept.id || dept.tempKey} style={styles.chipOuter}>
                    <View style={styles.chipShadow} />
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{dept.name}</Text>
                      <Pressable
                        onPress={() => removeDepartment(dept.id || dept.tempKey)}
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
            {saved ? <Text style={styles.saved}>Changes saved.</Text> : null}
            <CandyButton
              title="Save changes"
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
