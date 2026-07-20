import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import Avatar from '../components/Avatar';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { theme } from '../theme';

const ROLE_COLORS = {
  admin: { backgroundColor: theme.colors.violet, color: theme.colors.white },
  hr: { backgroundColor: theme.colors.sky, color: theme.colors.white },
  manager: { backgroundColor: theme.colors.coral, color: theme.colors.white },
  employee: { backgroundColor: theme.colors.teal, color: theme.colors.white },
};

const AVATAR_ACCENTS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];

export default function MyDepartmentScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const twoColumns = width >= 700;
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [colleagues, setColleagues] = useState([]);

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
          navigation.replace('MyDepartment', { companyId: current.companyId });
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
        setColleagues(
          current.departmentId
            ? companyEmployees.filter((e) => e.departmentId === current.departmentId)
            : []
        );
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

  const department = company.departments.find((d) => d.id === user.departmentId);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        {!user.departmentId ? (
          <OutlinedCard contentStyle={styles.emptyContent}>
            <Text style={styles.heading}>My Department</Text>
            <Text style={styles.emptyText}>
              You haven't been assigned to a department yet — check with your admin.
            </Text>
          </OutlinedCard>
        ) : (
          <>
            <Text style={styles.heading}>{department ? department.name : 'Unassigned'}</Text>
            <Text style={styles.subheading}>
              {colleagues.length} {colleagues.length === 1 ? 'person' : 'people'} in this
              department
            </Text>

            <View style={styles.grid}>
              {colleagues.map((emp, i) => {
                const accent = AVATAR_ACCENTS[i % AVATAR_ACCENTS.length];
                const roleStyle = ROLE_COLORS[emp.role] || {
                  backgroundColor: theme.colors.white,
                  color: theme.colors.ink,
                };
                return (
                  <OutlinedCard
                    key={emp.id}
                    style={twoColumns ? styles.cardHalf : styles.cardFull}
                    contentStyle={styles.cardContent}
                  >
                    <View style={styles.cardTop}>
                      <Avatar employeeId={emp.id} name={emp.name} size={44} accentColor={accent} />
                      <View style={styles.cardTopText}>
                        <Text style={styles.empName} numberOfLines={1}>
                          {emp.name}
                          {emp.id === user.id && (
                            <Text style={styles.youLabel}> (You)</Text>
                          )}
                        </Text>
                        <Text style={styles.empDesignation} numberOfLines={1}>
                          {emp.designation || '—'}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[styles.roleBadge, { backgroundColor: roleStyle.backgroundColor }]}
                    >
                      <Text style={[styles.roleBadgeText, { color: roleStyle.color }]}>
                        {emp.role.toUpperCase()}
                      </Text>
                    </View>
                  </OutlinedCard>
                );
              })}
            </View>
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
  subheading: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 4,
    marginBottom: 20,
  },
  emptyContent: {
    padding: 24,
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cardFull: {
    width: '100%',
  },
  cardHalf: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  cardContent: {
    padding: 20,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    color: theme.colors.white,
  },
  cardTopText: {
    flex: 1,
  },
  empName: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
  },
  youLabel: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
  },
  empDesignation: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginTop: 12,
  },
  roleBadgeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
  },
});
