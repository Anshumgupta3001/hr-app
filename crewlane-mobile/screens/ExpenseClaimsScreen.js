import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import ExpenseStatusPill from '../components/ExpenseStatusPill';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { expenseService } from '../services/expenseService';
import { theme } from '../theme';

const TABS = ['pending', 'approved', 'denied', 'all'];

export default function ExpenseClaimsScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [claims, setClaims] = useState([]);
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
          navigation.replace(
            current.role === 'superadmin' ? 'SuperAdminDashboard' : 'MyExpenses',
            current.role === 'superadmin' ? undefined : { companyId: current.companyId }
          );
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (current.companyId !== targetId) {
          navigation.replace('ExpenseClaims', { companyId: current.companyId });
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
        setClaims(await expenseService.getClaimsByCompany(targetId));
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

  const canDecide = user.role === 'admin';

  function employeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  async function decide(claimId, decision) {
    setDecidingIds((ids) => [...ids, claimId]);
    await expenseService.decideClaim(claimId, decision, user.id);
    setClaims(await expenseService.getClaimsByCompany(companyId));
    setDecidingIds((ids) => ids.filter((id) => id !== claimId));
  }

  const visible = tab === 'all' ? claims : claims.filter((c) => c.status === tab);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Expense Claims</Text>

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
          <Text style={styles.empty}>No {tab === 'all' ? '' : `${tab} `}claims.</Text>
        ) : (
          visible.map((claim) => {
            const deciding = decidingIds.includes(claim.id);
            return (
              <OutlinedCard key={claim.id} style={styles.card} contentStyle={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{employeeName(claim.employeeId)}</Text>
                    <Text style={styles.meta}>
                      {claim.category} · ₹{claim.amount}
                    </Text>
                    <Text style={styles.date}>Incurred {claim.dateIncurred}</Text>
                    {claim.description ? (
                      <Text style={styles.description}>“{claim.description}”</Text>
                    ) : null}
                  </View>
                  <ExpenseStatusPill status={claim.status} />
                </View>
                {canDecide && claim.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <CandyButton
                      title="Approve"
                      variant="teal"
                      small
                      pill
                      disabled={deciding}
                      onPress={() => decide(claim.id, 'approved')}
                    />
                    <CandyButton
                      title="Deny"
                      variant="primary"
                      small
                      pill
                      disabled={deciding}
                      onPress={() => decide(claim.id, 'denied')}
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
    ...theme.clayShadowButton,
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
    marginBottom: 14,
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
    fontSize: 16,
    color: theme.colors.ink,
  },
  meta: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 1,
  },
  date: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  description: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    fontStyle: 'italic',
    color: theme.colors.muted,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
});
