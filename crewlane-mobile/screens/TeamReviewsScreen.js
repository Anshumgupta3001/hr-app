import { useCallback, useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import ReviewCard from '../components/ReviewCard';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { performanceService } from '../services/performanceService';
import { theme } from '../theme';

export default function TeamReviewsScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [reports, setReports] = useState([]);
  const [reviews, setReviews] = useState({});
  const [loaded, setLoaded] = useState(false);

  const loadReviews = useCallback(async (activeCycle, directReports, cId) => {
    const map = {};
    for (const report of directReports) {
      map[report.id] = await performanceService.getOrCreateReview(
        cId,
        activeCycle.id,
        report.id
      );
    }
    setReviews(map);
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
        if (current.role === 'superadmin') {
          navigation.reset({ index: 0, routes: [{ name: 'SuperAdminDashboard' }] });
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (current.companyId !== targetId) {
          navigation.replace('TeamReviews', { companyId: current.companyId });
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const employees = await employeeService.getEmployeesByCompany(targetId);
        const directReports = employees.filter((e) => e.managerId === current.id);
        if (directReports.length === 0) {
          navigation.replace('Dashboard', { companyId: targetId });
          return;
        }
        const activeCycle = await performanceService.getActiveCycle(targetId);
        if (!active) return;
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setReports(directReports);
        setCycle(activeCycle);
        if (activeCycle) {
          await loadReviews(activeCycle, directReports, targetId);
        }
        setLoaded(true);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, loadReviews])
  );

  if (!user || !company || !loaded) {
    return <SafeAreaView style={styles.screen} />;
  }

  async function handleSubmitManager(reviewId, data) {
    await performanceService.submitManagerReview(reviewId, data);
    await loadReviews(cycle, reports, companyId);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Team Reviews</Text>

        {!cycle ? (
          <Text style={styles.empty}>No active review cycle right now.</Text>
        ) : (
          <>
            <Text style={styles.meta}>
              {cycle.name} · {reports.length} direct report{reports.length === 1 ? '' : 's'}
            </Text>
            {reports.map((report) =>
              reviews[report.id] ? (
                <ReviewCard
                  key={report.id}
                  title={report.name}
                  review={reviews[report.id]}
                  showManagerForm
                  onSubmitManager={handleSubmitManager}
                  style={styles.card}
                />
              ) : null
            )}
          </>
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
  },
  meta: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
    marginBottom: 20,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
    marginTop: 16,
  },
  card: {
    marginBottom: 14,
  },
});
