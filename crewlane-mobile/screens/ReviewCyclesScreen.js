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
import { employeeService } from '../services/employeeService';
import { performanceService } from '../services/performanceService';
import { theme } from '../theme';

const REVIEW_STATUS_LABELS = {
  pending_self: 'Awaiting self-review',
  pending_manager: 'Awaiting manager review',
  completed: 'Completed',
};

const REVIEW_STATUS_COLORS = {
  pending_self: theme.colors.mustard,
  pending_manager: theme.colors.sky,
  completed: theme.colors.teal,
};

export default function ReviewCyclesScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadCycles = useCallback(async (cId) => {
    const list = await performanceService.getCyclesByCompany(cId);
    setCycles(list);
    const active = list.find((c) => c.status === 'active');
    setReviews(active ? await performanceService.getReviewsByCycle(cId, active.id) : []);
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
        if (current.companyId !== targetId) {
          navigation.replace('ReviewCycles', { companyId: current.companyId });
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
        setEmployees(await employeeService.getEmployeesByCompany(targetId));
        await loadCycles(targetId);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, loadCycles])
  );

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  const activeCycle = cycles.find((c) => c.status === 'active') || null;
  const canCreate = name.trim() && startDate && endDate;

  async function handleCreate() {
    if (!canCreate) return;
    await performanceService.createCycle({ companyId, name, startDate, endDate });
    setName('');
    setStartDate('');
    setEndDate('');
    await loadCycles(companyId);
  }

  async function handleClose(cycleId) {
    await performanceService.closeCycle(cycleId);
    await loadCycles(companyId);
  }

  function reviewStatusFor(employeeId) {
    const review = reviews.find((r) => r.employeeId === employeeId);
    return review ? review.status : null;
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
          <Text style={styles.heading}>Review Cycles</Text>

          <OutlinedCard style={styles.card} contentStyle={styles.cardContent}>
            <Text style={styles.sectionTitle}>Create a cycle</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="H1 2026 Review"
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="2026-01-01"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
            />
            <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="2026-06-30"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
            />
            <CandyButton
              title="Create Cycle"
              variant="primary"
              disabled={!canCreate}
              onPress={handleCreate}
            />
          </OutlinedCard>

          {cycles.map((cycle) => (
            <OutlinedCard key={cycle.id} style={styles.card} contentStyle={styles.cardContent}>
              <View style={styles.cycleTop}>
                <View style={styles.cycleInfo}>
                  <Text style={styles.cycleName}>{cycle.name}</Text>
                  <Text style={styles.cycleDates}>
                    {cycle.startDate} to {cycle.endDate}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        cycle.status === 'active' ? theme.colors.teal : theme.colors.inputFill,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      cycle.status !== 'active' && { color: theme.colors.muted },
                    ]}
                  >
                    {cycle.status.toUpperCase()}
                  </Text>
                </View>
              </View>
              {cycle.status === 'active' && (
                <CandyButton
                  title="Close Cycle"
                  variant="secondary"
                  small
                  pill
                  onPress={() => handleClose(cycle.id)}
                  style={styles.closeButton}
                />
              )}
              {cycle.status === 'active' && activeCycle?.id === cycle.id && (
                <View style={styles.completion}>
                  <Text style={styles.completionLabel}>REVIEW COMPLETION</Text>
                  {employees.map((emp) => {
                    const status = reviewStatusFor(emp.id);
                    return (
                      <View key={emp.id} style={styles.completionRow}>
                        <Text style={styles.completionName} numberOfLines={1}>
                          {emp.name}
                        </Text>
                        <View
                          style={[
                            styles.completionPill,
                            {
                              backgroundColor: status
                                ? REVIEW_STATUS_COLORS[status]
                                : theme.colors.inputFill,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.completionPillText,
                              !status && { color: theme.colors.muted },
                            ]}
                          >
                            {status ? REVIEW_STATUS_LABELS[status] : 'Not started'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </OutlinedCard>
          ))}
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
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.ink,
    marginBottom: 20,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
    marginBottom: 14,
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
    marginBottom: 14,
  },
  cycleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cycleInfo: {
    flex: 1,
  },
  cycleName: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
  },
  cycleDates: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 9,
    color: theme.colors.white,
  },
  closeButton: {
    marginTop: 12,
  },
  completion: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51,47,58,0.08)',
    gap: 8,
  },
  completionLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: theme.colors.muted,
    marginBottom: 2,
  },
  completionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  completionName: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    flexShrink: 1,
  },
  completionPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  completionPillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
  },
});
