import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import LeaveStatusPill from '../components/LeaveStatusPill';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { leavePolicyService } from '../services/leavePolicyService';
import { leaveRequestService } from '../services/leaveRequestService';
import { theme } from '../theme';

const TABS = ['pending', 'approved', 'denied', 'all'];

export default function LeaveRequestsScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('pending');
  const [decidingIds, setDecidingIds] = useState([]);

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
          navigation.replace('MyLeave', { companyId: current.companyId });
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (!targetId || current.companyId !== targetId) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'LeaveRequests', params: { companyId: current.companyId } }],
          });
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const [companyPolicy, companyEmployees, companyRequests] = await Promise.all([
          leavePolicyService.getCompanyPolicy(targetId),
          employeeService.getEmployeesByCompany(targetId),
          leaveRequestService.getRequestsByCompany(targetId),
        ]);
        if (!active) return;
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setPolicy(companyPolicy);
        setEmployees(companyEmployees);
        setRequests(companyRequests);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId])
  );

  if (!user || !company || !policy) {
    return <SafeAreaView style={styles.screen} />;
  }

  const canDecide = user.role === 'admin';

  function employeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  function typeName(leaveTypeId) {
    const type = policy.leaveTypes.find((t) => t.id === leaveTypeId);
    return type ? type.name : 'Leave';
  }

  async function decide(requestId, action) {
    setDecidingIds((ids) => [...ids, requestId]);
    if (action === 'approve') {
      await leaveRequestService.approveRequest(requestId, user.id);
    } else {
      await leaveRequestService.denyRequest(requestId, user.id);
    }
    setRequests(await leaveRequestService.getRequestsByCompany(companyId));
    setDecidingIds((ids) => ids.filter((id) => id !== requestId));
  }

  const visible = tab === 'all' ? requests : requests.filter((r) => r.status === tab);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar
        user={user}
        company={company}
        companyId={companyId}
        navigation={navigation}
        active="LeaveRequests"
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Leave Requests</Text>

        <View style={styles.tabRow}>
          {TABS.map((t) => {
            const selected = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.tab, selected && styles.tabSelected]}
              >
                <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {visible.length === 0 ? (
          <Text style={styles.empty}>
            No {tab === 'all' ? '' : `${tab} `}requests.
          </Text>
        ) : (
          visible.map((req) => {
            const deciding = decidingIds.includes(req.id);
            return (
              <OutlinedCard key={req.id} style={styles.card} contentStyle={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{employeeName(req.employeeId)}</Text>
                    <Text style={styles.type}>{typeName(req.leaveTypeId)}</Text>
                    <Text style={styles.dates}>
                      {req.startDate} to {req.endDate} · {req.totalDays} day(s)
                    </Text>
                    {req.reason ? (
                      <Text style={styles.reason}>“{req.reason}”</Text>
                    ) : null}
                    <Text style={styles.requestedAt}>
                      Requested {new Date(req.requestedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <LeaveStatusPill status={req.status} />
                </View>
                {canDecide && req.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <CandyButton
                      title="Approve"
                      variant="teal"
                      small
                      pill
                      disabled={deciding}
                      onPress={() => decide(req.id, 'approve')}
                    />
                    <CandyButton
                      title="Deny"
                      variant="primary"
                      small
                      pill
                      disabled={deciding}
                      onPress={() => decide(req.id, 'deny')}
                    />
                  </View>
                )}
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
    marginBottom: 18,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tab: {
    borderRadius: 999,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  tabSelected: {
    backgroundColor: theme.colors.violet,
  },
  tabText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
  },
  tabTextSelected: {
    color: theme.colors.white,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 18,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardInfo: {
    flex: 1,
  },
  name: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
  },
  type: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    opacity: 0.6,
    marginTop: 1,
  },
  dates: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.ink,
    opacity: 0.7,
    marginTop: 3,
  },
  reason: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.colors.ink,
    opacity: 0.6,
    marginTop: 4,
  },
  requestedAt: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.ink,
    opacity: 0.4,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
});
