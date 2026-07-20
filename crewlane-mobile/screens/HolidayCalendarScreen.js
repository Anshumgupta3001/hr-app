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
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { holidayService } from '../services/holidayService';
import { theme } from '../theme';

export default function HolidayCalendarScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const loadHolidays = useCallback(async (id) => {
    setHolidays(await holidayService.getHolidaysByCompany(id));
  }, []);

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
            routes: [{ name: 'HolidayCalendar', params: { companyId: current.companyId } }],
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
        await loadHolidays(targetId);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, loadHolidays])
  );

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  const canAdd = name.trim() && date;

  async function handleAdd() {
    if (!canAdd) return;
    setError('');
    try {
      await holidayService.createHoliday({ companyId, name, date });
      setName('');
      setDate('');
      await loadHolidays(companyId);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(id) {
    await holidayService.removeHoliday(id);
    await loadHolidays(companyId);
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
          <OutlinedCard style={styles.formCard}>
            <Text style={styles.heading}>Holidays</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Independence Day"
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-08-15"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <CandyButton
              title="+ Add Holiday"
              variant="mustard"
              disabled={!canAdd}
              onPress={handleAdd}
              style={styles.addButton}
            />
          </OutlinedCard>

          {holidays.length === 0 ? (
            <Text style={styles.empty}>No holidays declared yet.</Text>
          ) : (
            holidays.map((h) => (
              <OutlinedCard key={h.id} style={styles.holidayCard} contentStyle={styles.holidayContent}>
                <View style={styles.holidayInfo}>
                  <Text style={styles.holidayName}>{h.name}</Text>
                  <Text style={styles.holidayDate}>
                    {new Date(`${h.date}T00:00:00`).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                <CandyButton
                  title="Remove"
                  variant="primary"
                  small
                  pill
                  onPress={() => handleRemove(h.id)}
                />
              </OutlinedCard>
            ))
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
    padding: 24,
    paddingBottom: 48,
  },
  formCard: {
    marginBottom: 20,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 26,
    color: theme.colors.ink,
    marginBottom: 16,
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
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.coral,
    marginBottom: 12,
  },
  addButton: {
    marginTop: 4,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  holidayCard: {
    marginBottom: 14,
  },
  holidayContent: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  holidayInfo: {
    flex: 1,
  },
  holidayName: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  holidayDate: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
});
