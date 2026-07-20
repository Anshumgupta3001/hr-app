import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import PraiseCard from '../components/PraiseCard';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { praiseService } from '../services/praiseService';
import { theme } from '../theme';

const MAX_LENGTH = 200;

function OptionPills({ options, value, onChange, labelFor = (v) => v }) {
  return (
    <View style={styles.pillRow}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Text
            key={opt}
            onPress={() => onChange(opt)}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            {labelFor(opt)}
          </Text>
        );
      })}
    </View>
  );
}

export default function PraiseWallScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [praises, setPraises] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [toEmployeeId, setToEmployeeId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
          navigation.replace('PraiseWall', { companyId: current.companyId });
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const companyEmployees = await employeeService.getEmployeesByCompany(targetId);
        if (!active) return;
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setEmployees(companyEmployees);
        setPraises(await praiseService.getPraisesByCompany(targetId));
        setToEmployeeId((prev) => prev || companyEmployees.find((e) => e.id !== current.id)?.id || '');
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

  function employeeName(id) {
    if (id === user.id) return user.name;
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : 'Former employee';
  }

  const recipients = employees.filter((e) => e.id !== user.id);
  const canSubmit = toEmployeeId && message.trim();

  async function handleSubmit() {
    if (!canSubmit) return;
    setError('');
    try {
      await praiseService.createPraise({
        companyId,
        fromEmployeeId: user.id,
        toEmployeeId,
        message,
      });
      setMessage('');
      setShowForm(false);
      setPraises(await praiseService.getPraisesByCompany(companyId));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <BackButton />
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Praise Wall</Text>
            {recipients.length > 0 && (
              <CandyButton
                title="+ Give Praise"
                variant="primary"
                small
                pill
                onPress={() => setShowForm((v) => !v)}
              />
            )}
          </View>

          {showForm && (
            <OutlinedCard style={styles.formCard}>
              <Text style={styles.label}>Employee</Text>
              <OptionPills
                options={recipients.map((e) => e.id)}
                value={toEmployeeId}
                onChange={setToEmployeeId}
                labelFor={(id) => recipients.find((e) => e.id === id)?.name || ''}
              />
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={message}
                onChangeText={(v) => setMessage(v.slice(0, MAX_LENGTH))}
                placeholder="Shout out something great they did"
                placeholderTextColor={theme.colors.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {message.length}/{MAX_LENGTH}
              </Text>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <CandyButton
                title="Send Praise"
                variant="primary"
                disabled={!canSubmit}
                onPress={handleSubmit}
                style={styles.submit}
              />
            </OutlinedCard>
          )}

          <View style={styles.feed}>
            {praises.length === 0 ? (
              <Text style={styles.empty}>No praise given yet — be the first.</Text>
            ) : (
              praises.map((praise) => (
                <PraiseCard
                  key={praise.id}
                  praise={praise}
                  fromName={employeeName(praise.fromEmployeeId)}
                  toName={employeeName(praise.toEmployeeId)}
                  style={styles.praiseCard}
                />
              ))
            )}
          </View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.ink,
  },
  formCard: {
    marginBottom: 20,
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    marginBottom: 8,
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
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    overflow: 'hidden',
  },
  pillSelected: {
    backgroundColor: theme.colors.violet,
    color: theme.colors.white,
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
  charCount: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.muted,
    textAlign: 'right',
    marginTop: 4,
  },
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.coral,
    marginTop: 12,
  },
  submit: {
    marginTop: 12,
  },
  feed: {
    gap: 14,
  },
  praiseCard: {
    marginBottom: 0,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
  },
});
