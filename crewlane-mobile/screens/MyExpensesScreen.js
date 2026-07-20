import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
import { expenseService } from '../services/expenseService';
import { theme } from '../theme';

export default function MyExpensesScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [claims, setClaims] = useState([]);

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
        if (!['hr', 'manager', 'employee'].includes(current.role)) {
          navigation.replace(
            current.role === 'superadmin' ? 'SuperAdminDashboard' : 'ExpenseClaims',
            current.role === 'superadmin' ? undefined : { companyId: current.companyId }
          );
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (current.companyId !== targetId) {
          navigation.replace('MyExpenses', { companyId: current.companyId });
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
        setClaims(await expenseService.getClaimsByEmployee(current.id));
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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <View style={styles.headerRow}>
          <Text style={styles.heading}>My Expenses</Text>
          <CandyButton
            title="+ Submit Expense"
            variant="primary"
            small
            pill
            onPress={() => navigation.navigate('SubmitExpense', { companyId })}
          />
        </View>

        {claims.length === 0 ? (
          <Text style={styles.empty}>No expense claims yet.</Text>
        ) : (
          claims.map((claim) => (
            <OutlinedCard key={claim.id} style={styles.card} contentStyle={styles.cardContent}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.amount}>
                    ₹{claim.amount} <Text style={styles.category}>· {claim.category}</Text>
                  </Text>
                  <Text style={styles.date}>Incurred {claim.dateIncurred}</Text>
                  {claim.description ? (
                    <Text style={styles.description}>“{claim.description}”</Text>
                  ) : null}
                </View>
                <ExpenseStatusPill status={claim.status} />
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
    marginBottom: 20,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.ink,
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
  amount: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
  },
  category: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.muted,
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
});
