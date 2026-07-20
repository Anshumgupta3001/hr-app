import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
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

export default function EmployeesScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const twoColumns = width >= 700;
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [employees, setEmployees] = useState([]);

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
          navigation.reset({
            index: 0,
            routes: [{ name: 'Employees', params: { companyId: current.companyId } }],
          });
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const list = await employeeService.getEmployeesByCompany(targetId);
        if (!active) return;
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setEmployees(list);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId])
  );

  async function handleRemove(id) {
    await employeeService.removeEmployee(id);
    setEmployees(await employeeService.getEmployeesByCompany(companyId));
  }

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  const canManage = ['admin', 'hr'].includes(user.role);

  function departmentName(departmentId) {
    const dept = company.departments.find((d) => d.id === departmentId);
    return dept ? dept.name : '—';
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar
        user={user}
        company={company}
        companyId={companyId}
        navigation={navigation}
        active="Employees"
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <View style={styles.headerRow}>
          <Text style={styles.heading}>
            Employees <Text style={styles.count}>({employees.length})</Text>
          </Text>
          {canManage && (
            <CandyButton
              title="+ Add Employee"
              variant="primary"
              small
              pill
              onPress={() => navigation.navigate('EmployeeForm', { companyId })}
            />
          )}
        </View>

        {employees.length === 0 ? (
          <Text style={styles.empty}>
            No employees yet{canManage ? ' — add the first one.' : '.'}
          </Text>
        ) : (
          <View style={styles.grid}>
            {employees.map((emp, i) => {
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
                    <Avatar
                      employeeId={emp.id}
                      name={emp.name}
                      size={44}
                      accentColor={accent}
                    />
                    <View style={styles.cardTopText}>
                      <Text style={styles.empName} numberOfLines={1}>
                        {emp.name}
                      </Text>
                      <Text style={styles.empDesignation} numberOfLines={1}>
                        {emp.designation || '—'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.empEmail} numberOfLines={1}>
                    {emp.email}
                  </Text>
                  <Text style={styles.empDept}>Dept: {departmentName(emp.departmentId)}</Text>
                  <View style={styles.badgeRow}>
                    <View
                      style={[styles.badge, { backgroundColor: roleStyle.backgroundColor }]}
                    >
                      <Text style={[styles.badgeText, { color: roleStyle.color }]}>
                        {emp.role.toUpperCase()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            emp.status === 'active' ? theme.colors.teal : theme.colors.coral,
                        },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: theme.colors.white }]}>
                        {emp.status}
                      </Text>
                    </View>
                  </View>
                  {canManage && (
                    <View style={styles.actionRow}>
                      <CandyButton
                        title="Edit"
                        variant="secondary"
                        small
                        pill
                        onPress={() =>
                          navigation.navigate('EmployeeForm', {
                            companyId,
                            employeeId: emp.id,
                          })
                        }
                      />
                      <CandyButton
                        title="Checklist"
                        variant="secondary"
                        small
                        pill
                        onPress={() =>
                          navigation.navigate('EmployeeChecklist', {
                            companyId,
                            employeeId: emp.id,
                          })
                        }
                      />
                      <CandyButton
                        title="View Documents"
                        variant="secondary"
                        small
                        pill
                        onPress={() =>
                          navigation.navigate('EmployeeDocuments', {
                            companyId,
                            employeeId: emp.id,
                          })
                        }
                      />
                      {emp.id !== user.id && (
                        <CandyButton
                          title="Remove"
                          variant="primary"
                          small
                          pill
                          onPress={() => handleRemove(emp.id)}
                        />
                      )}
                    </View>
                  )}
                </OutlinedCard>
              );
            })}
          </View>
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
  count: {
    color: theme.colors.muted,
    fontSize: 22,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
    marginTop: 16,
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
  empDesignation: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  empEmail: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.ink,
    marginTop: 10,
  },
  empDept: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.ink,
    opacity: 0.7,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
});
