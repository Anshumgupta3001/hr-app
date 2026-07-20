import { useCallback, useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import OrgChartNode from '../components/OrgChartNode';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { theme } from '../theme';

export function buildOrgTree(employees) {
  const admin = employees.find((e) => e.role === 'admin') || null;
  const validIds = new Set(employees.map((e) => e.id));
  const childrenByManager = {};

  for (const employee of employees) {
    if (admin && employee.id === admin.id) continue;
    const parentId =
      employee.managerId && validIds.has(employee.managerId) && employee.managerId !== employee.id
        ? employee.managerId
        : admin
          ? admin.id
          : 'root';
    (childrenByManager[parentId] ||= []).push(employee);
  }

  if (admin) {
    const reachable = new Set([admin.id]);
    const queue = [admin.id];
    while (queue.length) {
      const id = queue.shift();
      for (const child of childrenByManager[id] || []) {
        if (!reachable.has(child.id)) {
          reachable.add(child.id);
          queue.push(child.id);
        }
      }
    }
    for (const employee of employees) {
      if (!reachable.has(employee.id)) {
        const list = childrenByManager[employee.managerId] || [];
        childrenByManager[employee.managerId] = list.filter((e) => e.id !== employee.id);
        (childrenByManager[admin.id] ||= []).push(employee);
        reachable.add(employee.id);
      }
    }
  }

  return { admin, childrenByManager };
}

export default function OrgChartScreen({ navigation, route }) {
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
          navigation.replace('OrgChart', { companyId: current.companyId });
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

  const { admin, childrenByManager } = buildOrgTree(employees);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Org Chart</Text>
        {admin ? (
          <OrgChartNode employee={admin} childrenByManager={childrenByManager} />
        ) : (
          <Text style={styles.empty}>No employees yet.</Text>
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
});
