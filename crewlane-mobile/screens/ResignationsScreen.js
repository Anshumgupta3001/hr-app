import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
import { resignationService } from '../services/resignationService';
import { theme } from '../theme';

export default function ResignationsScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [resignations, setResignations] = useState([]);
  const [ackIds, setAckIds] = useState([]);

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
          navigation.replace('Resignations', { companyId: current.companyId });
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
        setResignations(await resignationService.getByCompany(targetId));
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

  function employeeName(employeeId) {
    if (employeeId === user.id) return user.name;
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  async function handleAcknowledge(id) {
    setAckIds((ids) => [...ids, id]);
    await resignationService.acknowledgeResignation(id);
    setResignations(await resignationService.getByCompany(companyId));
    setEmployees(await employeeService.getEmployeesByCompany(companyId));
    setAckIds((ids) => ids.filter((i) => i !== id));
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Resignations</Text>

        {resignations.length === 0 ? (
          <Text style={styles.empty}>No resignation requests.</Text>
        ) : (
          resignations.map((r) => {
            const acking = ackIds.includes(r.id);
            return (
              <OutlinedCard key={r.id} style={styles.card} contentStyle={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{employeeName(r.employeeId)}</Text>
                    <Text style={styles.meta}>
                      Last working day: {r.proposedLastWorkingDay}
                    </Text>
                    {r.reason ? <Text style={styles.reason}>“{r.reason}”</Text> : null}
                    <Text style={styles.date}>
                      Submitted {new Date(r.submittedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          r.status === 'pending' ? theme.colors.mustard : theme.colors.teal,
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>{r.status.toUpperCase()}</Text>
                  </View>
                </View>
                {r.status === 'pending' && (
                  <CandyButton
                    title="Acknowledge"
                    variant="teal"
                    small
                    pill
                    disabled={acking}
                    onPress={() => handleAcknowledge(r.id)}
                    style={styles.ackButton}
                  />
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
    marginBottom: 20,
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
    fontSize: 12,
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
  date: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 4,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    ...theme.clayShadowButton,
  },
  statusText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 9,
    color: theme.colors.white,
  },
  ackButton: {
    marginTop: 12,
  },
});
