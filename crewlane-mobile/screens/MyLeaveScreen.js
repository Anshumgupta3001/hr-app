import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import LeaveBalanceCard from '../components/LeaveBalanceCard';
import LeaveStatusPill from '../components/LeaveStatusPill';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { leavePolicyService } from '../services/leavePolicyService';
import { leaveBalanceService } from '../services/leaveBalanceService';
import { leaveRequestService } from '../services/leaveRequestService';
import { theme } from '../theme';

export default function MyLeaveScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const twoColumns = width >= 700;
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);

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
        if (current.role === 'admin') {
          navigation.replace('LeaveRequests', { companyId: current.companyId });
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (current.companyId !== targetId) {
          navigation.replace('MyLeave', { companyId: current.companyId });
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const [companyPolicy, myBalances, myRequests] = await Promise.all([
          leavePolicyService.getCompanyPolicy(targetId),
          leaveBalanceService.getBalances(current.id, targetId),
          leaveRequestService.getRequestsByEmployee(current.id),
        ]);
        if (!active) return;
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setPolicy(companyPolicy);
        setBalances(myBalances);
        setRequests(myRequests);
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

  function typeName(leaveTypeId) {
    const type = policy.leaveTypes.find((t) => t.id === leaveTypeId);
    return type ? type.name : 'Leave';
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar
        user={user}
        company={company}
        companyId={companyId}
        navigation={navigation}
        active="MyLeave"
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <View style={styles.headerRow}>
          <Text style={styles.heading}>My Leave</Text>
          <CandyButton
            title="+ Apply for Leave"
            variant="primary"
            small
            pill
            onPress={() => navigation.navigate('ApplyForLeave', { companyId })}
          />
        </View>

        <View style={styles.grid}>
          {balances.map((balance) => (
            <LeaveBalanceCard
              key={balance.leaveTypeId}
              balance={balance}
              style={twoColumns ? styles.cardHalf : styles.cardFull}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>My Requests</Text>
        {requests.length === 0 ? (
          <Text style={styles.empty}>No leave requests yet.</Text>
        ) : (
          requests.map((req) => (
            <OutlinedCard key={req.id} style={styles.requestCard} contentStyle={styles.requestContent}>
              <View style={styles.requestRow}>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestType}>{typeName(req.leaveTypeId)}</Text>
                  <Text style={styles.requestDates}>
                    {req.startDate} to {req.endDate} · {req.totalDays} day(s)
                  </Text>
                  {req.reason ? (
                    <Text style={styles.requestReason}>“{req.reason}”</Text>
                  ) : null}
                </View>
                <LeaveStatusPill status={req.status} />
              </View>
            </OutlinedCard>
          ))
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  cardFull: {
    width: '100%',
  },
  cardHalf: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    color: theme.colors.ink,
    marginBottom: 16,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  requestCard: {
    marginBottom: 16,
  },
  requestContent: {
    padding: 18,
  },
  requestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  requestInfo: {
    flex: 1,
  },
  requestType: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
  },
  requestDates: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.ink,
    opacity: 0.7,
    marginTop: 2,
  },
  requestReason: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.colors.ink,
    opacity: 0.6,
    marginTop: 4,
  },
});
