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

export default function LeavePolicyScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState(false);
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
        if (current.role !== 'admin') {
          navigation.replace(
            current.role === 'superadmin' ? 'SuperAdminDashboard' : 'Dashboard',
            current.role === 'superadmin' ? undefined : { companyId: current.companyId }
          );
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (!targetId || current.companyId !== targetId) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'LeavePolicy', params: { companyId: current.companyId } }],
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
          const policy = await leavePolicyService.getCompanyPolicy(targetId);
          if (!active) return;
          setRows(policy.leaveTypes.map((t) => ({ ...t })));
          setLoaded(true);
        }
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, loaded])
  );

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  function updateRow(key, field, value) {
    setRows((prev) =>
      prev.map((r) => ((r.id || r.tempKey) === key ? { ...r, [field]: value } : r))
    );
    setSaved(false);
  }

  function removeRow(key) {
    setRows((prev) => prev.filter((r) => (r.id || r.tempKey) !== key));
    setSaved(false);
  }

  function addRow() {
    // tempKey is a client-only React key for the unsaved row — it is never
    // sent to the backend, which mints the real id once it's saved.
    setRows((prev) => [...prev, { tempKey: uuidv4(), name: '', annualQuota: 0 }]);
    setSaved(false);
  }

  const canSave = rows.some((r) => r.name.trim());

  async function handleSave() {
    if (!canSave) return;
    setError('');
    setSaved(false);
    try {
      const updated = await leavePolicyService.updateCompanyPolicy(companyId, rows);
      setRows(updated.leaveTypes.map((t) => ({ ...t })));
      setSaved(true);
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
        active="LeavePolicy"
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
            <Text style={styles.heading}>Leave Policy</Text>
            {rows.map((row) => (
              <View key={row.id || row.tempKey} style={styles.row}>
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  value={row.name}
                  onChangeText={(v) => updateRow(row.id || row.tempKey, 'name', v)}
                  placeholder="Leave type name"
                  placeholderTextColor={theme.colors.muted}
                />
                <TextInput
                  style={[styles.input, styles.quotaInput]}
                  value={String(row.annualQuota)}
                  onChangeText={(v) => updateRow(row.id || row.tempKey, 'annualQuota', v)}
                  keyboardType="number-pad"
                />
                <Pressable
                  onPress={() => removeRow(row.id || row.tempKey)}
                  hitSlop={8}
                  accessibilityLabel={`Remove ${row.name || 'row'}`}
                >
                  <Text style={styles.remove}>×</Text>
                </Pressable>
              </View>
            ))}
            <CandyButton
              title="+ Add Leave Type"
              variant="mustard"
              small
              pill
              onPress={addRow}
              style={styles.addButton}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {saved ? <Text style={styles.saved}>Policy saved.</Text> : null}
            <CandyButton
              title="Save Policy"
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.ink,
  },
  nameInput: {
    flex: 1,
  },
  quotaInput: {
    width: 70,
    textAlign: 'center',
  },
  remove: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 20,
    color: theme.colors.ink,
  },
  addButton: {
    marginTop: 4,
    marginBottom: 8,
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
    marginTop: 8,
  },
});
