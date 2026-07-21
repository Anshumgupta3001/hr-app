import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
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
import { attendanceService } from '../services/attendanceService';
import { theme } from '../theme';

const TABS = ['pending', 'approved', 'denied', 'all'];

const STATUS_COLORS = {
  pending: theme.colors.mustard,
  approved: theme.colors.teal,
  denied: theme.colors.coral,
};

function StatusPill({ status }) {
  return (
    <View style={[styles.pill, { backgroundColor: STATUS_COLORS[status] || theme.colors.white }]}>
      <Text style={styles.pillText}>{status.toUpperCase()}</Text>
    </View>
  );
}

function formatTime(dateStr) {
  return dateStr
    ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
}

export default function RegularizationRequestsScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('pending');
  const [decidingIds, setDecidingIds] = useState([]);

  const loadRequests = useCallback(async () => {
    setRequests(await attendanceService.getRegularizations());
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const current = await authService.getCurrentUser();
        if (!active) return;
        if (!current || !['admin', 'hr'].includes(current.role)) {
          navigation.goBack();
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        const found = await companyService.getCompanyById(targetId);
        if (!active || !found) return;
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setEmployees(await employeeService.getEmployeesByCompany(targetId));
        await loadRequests();
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, loadRequests])
  );

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  const canDecide = user.role === 'admin';

  function employeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  async function decide(id, action) {
    setDecidingIds((ids) => [...ids, id]);
    if (action === 'approve') {
      await attendanceService.approveRegularization(id);
    } else {
      await attendanceService.denyRegularization(id);
    }
    await loadRequests();
    setDecidingIds((ids) => ids.filter((i) => i !== id));
  }

  const visible = tab === 'all' ? requests : requests.filter((r) => r.status === tab);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Regularization Requests</Text>

        <View style={styles.tabRow}>
          {TABS.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {visible.length === 0 ? (
          <Text style={styles.empty}>No {tab === 'all' ? '' : `${tab} `}requests.</Text>
        ) : (
          visible.map((req) => {
            const deciding = decidingIds.includes(req.id);
            return (
              <OutlinedCard key={req.id} style={styles.card} contentStyle={styles.cardContent}>
                <View style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>
                      {employeeName(req.employeeId)} · {req.date}
                    </Text>
                    <Text style={styles.sub}>
                      Proposed {formatTime(req.requestedClockInTime)} to{' '}
                      {formatTime(req.requestedClockOutTime)}
                    </Text>
                    {req.reason ? <Text style={styles.reason}>“{req.reason}”</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <StatusPill status={req.status} />
                    {canDecide && req.status === 'pending' && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <CandyButton
                          title="Approve"
                          variant="teal"
                          small
                          disabled={deciding}
                          onPress={() => decide(req.id, 'approve')}
                        />
                        <CandyButton
                          title="Deny"
                          variant="primary"
                          small
                          disabled={deciding}
                          onPress={() => decide(req.id, 'deny')}
                        />
                      </View>
                    )}
                  </View>
                </View>
              </OutlinedCard>
            );
          })
        )}
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
    fontSize: 28,
    color: theme.colors.ink,
    marginBottom: 20,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.white,
  },
  tabActive: {
    backgroundColor: theme.colors.violet,
  },
  tabText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    textTransform: 'capitalize',
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.muted,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 18,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  sub: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  reason: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.colors.muted,
    marginTop: 4,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 3,
    ...theme.clayShadowButton,
  },
  pillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
  },
});
