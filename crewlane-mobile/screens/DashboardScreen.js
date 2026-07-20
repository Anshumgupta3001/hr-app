import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import OutlinedCard from '../components/OutlinedCard';
import ConfettiBackground from '../components/ConfettiBackground';
import MarkerHighlight from '../components/MarkerHighlight';
import ComingSoonCard from '../components/ComingSoonCard';
import NavBar from '../components/NavBar';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { leaveRequestService } from '../services/leaveRequestService';
import { leaveBalanceService } from '../services/leaveBalanceService';
import { announcementService } from '../services/announcementService';
import { theme } from '../theme';

const ICON = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
};

const STROKE = {
  stroke: theme.colors.white,
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
};

const EmployeesIcon = (
  <Svg {...ICON}>
    <Circle cx={9} cy={8} r={3.2} {...STROKE} />
    <Path d="M3 20c0-3.4 2.7-5 6-5s6 1.6 6 5" {...STROKE} />
    <Circle cx={17} cy={9} r={2.4} {...STROKE} />
    <Path d="M16.5 15.2c2.6.3 4.5 1.8 4.5 4.3" {...STROKE} />
  </Svg>
);

const AttendanceIcon = (
  <Svg {...ICON}>
    <Rect x={3} y={5} width={18} height={16} rx={2.5} {...STROKE} />
    <Path d="M3 9.5h18" {...STROKE} />
    <Path d="M8 2.5v4M16 2.5v4" {...STROKE} />
    <Path d="M8.5 14.5l2.4 2.4 4.6-4.6" {...STROKE} />
  </Svg>
);

const LeaveIcon = (
  <Svg {...ICON}>
    <Circle cx={12} cy={12} r={4} {...STROKE} />
    <Path
      d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"
      {...STROKE}
    />
  </Svg>
);

const PayrollIcon = (
  <Svg {...ICON}>
    <Rect x={2.5} y={6} width={19} height={12} rx={2.5} {...STROKE} />
    <Circle cx={12} cy={12} r={2.6} {...STROKE} />
    <Path d="M6 12h.01M18 12h.01" {...STROKE} />
  </Svg>
);

const DocumentsIcon = (
  <Svg {...ICON}>
    <Rect x={2.5} y={5} width={19} height={14} rx={2.5} {...STROKE} />
    <Circle cx={8} cy={10.5} r={2} {...STROKE} />
    <Path d="M5 16c.6-1.7 1.7-2.4 3-2.4s2.4.7 3 2.4" {...STROKE} />
    <Path d="M14 9.5h5M14 13h5" {...STROKE} />
  </Svg>
);

const PerformanceIcon = (
  <Svg {...ICON}>
    <Path d="M4 21V11" {...STROKE} />
    <Path d="M10 21V4" {...STROKE} />
    <Path d="M16 21v-8" {...STROKE} />
    <Path d="M22 21H2" {...STROKE} />
  </Svg>
);

const DepartmentIcon = (
  <Svg {...ICON}>
    <Rect x={3} y={10} width={7} height={11} rx={1.5} {...STROKE} />
    <Rect x={14} y={6} width={7} height={15} rx={1.5} {...STROKE} />
    <Path d="M6.5 14h.01M6.5 17h.01M17.5 10h.01M17.5 13h.01M17.5 16h.01" {...STROKE} />
  </Svg>
);

const COMING_SOON_MODULES = [
  {
    title: 'Attendance',
    description: 'Clock-ins, timesheets, and schedules.',
    accent: 'teal',
    icon: AttendanceIcon,
  },
  {
    title: 'Payroll',
    description: 'Salaries, payslips, and tax runs.',
    accent: 'mustard',
    icon: PayrollIcon,
  },
  {
    title: 'Documents',
    description: 'Secure document storage for your team.',
    accent: 'sky',
    icon: DocumentsIcon,
  },
];

export default function DashboardScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [companyId, setCompanyId] = useState(null);
  const [leaveSummary, setLeaveSummary] = useState('');
  const [leaveTargetScreen, setLeaveTargetScreen] = useState('MyLeave');
  const [deptLabel, setDeptLabel] = useState('Unassigned');
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);

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
            routes: [{ name: 'Dashboard', params: { companyId: current.companyId } }],
          });
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const companyEmployees = await employeeService.getEmployeesByCompany(targetId);
        if (current.role === 'admin') {
          const companyRequests = await leaveRequestService.getRequestsByCompany(targetId);
          const pending = companyRequests.filter((r) => r.status === 'pending').length;
          if (!active) return;
          setLeaveSummary(`${pending} request${pending === 1 ? '' : 's'} awaiting approval`);
          setLeaveTargetScreen('LeaveRequests');
        } else {
          const balances = await leaveBalanceService.getBalances(current.id, targetId);
          const remaining = balances.reduce((sum, b) => sum + b.remaining, 0);
          if (!active) return;
          setLeaveSummary(`${remaining} day${remaining === 1 ? '' : 's'} remaining`);
          setLeaveTargetScreen('MyLeave');
        }
        if (current.departmentId) {
          const dept = found.departments.find((d) => d.id === current.departmentId);
          const count = companyEmployees.filter(
            (e) => e.departmentId === current.departmentId
          ).length;
          setDeptLabel(`${dept ? dept.name : 'Unassigned'} — ${count} people`);
        } else {
          setDeptLabel('Unassigned');
        }
        const latest = await announcementService.getLatest(targetId);
        if (!active) return;
        setLatestAnnouncement(latest);
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setEmployeeCount(companyEmployees.length);
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

  const firstName = user.name.split(' ')[0];

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground />
      <NavBar
        user={user}
        company={company}
        companyId={companyId}
        navigation={navigation}
        active="Dashboard"
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.welcomeRow}>
          <Text style={styles.welcome}>Welcome back, </Text>
          <MarkerHighlight textStyle={styles.welcome}>{firstName}</MarkerHighlight>
        </View>

        <View style={styles.statsGrid}>
          <OutlinedCard style={styles.statCard} contentStyle={styles.statContent}>
            <Text style={styles.statLabel}>COMPANY</Text>
            <Text style={styles.statValue}>{company.name}</Text>
          </OutlinedCard>
          <OutlinedCard style={styles.statCard} contentStyle={styles.statContent}>
            <Text style={styles.statLabel}>INDUSTRY</Text>
            <Text style={styles.statValue}>{company.industry || '—'}</Text>
          </OutlinedCard>
          <OutlinedCard style={styles.statCard} contentStyle={styles.statContent}>
            <Text style={styles.statLabel}>DEPARTMENTS</Text>
            <Text style={styles.statValue}>{company.departments.length}</Text>
          </OutlinedCard>
          <OutlinedCard style={styles.statCard} contentStyle={styles.statContent}>
            <Text style={styles.statLabel}>EMPLOYEES</Text>
            <Text style={styles.statValue}>{employeeCount}</Text>
          </OutlinedCard>
        </View>

        <Pressable
          onPress={() => navigation.navigate('CompanyFeed', { companyId })}
          style={styles.moduleCard}
        >
          <View style={styles.activeShadow} />
          <View style={styles.activeCard}>
            <Text style={styles.statLabel}>LATEST ANNOUNCEMENT</Text>
            {latestAnnouncement ? (
              <>
                <Text style={styles.activeTitle}>{latestAnnouncement.title}</Text>
                <Text style={styles.activeDescription} numberOfLines={2}>
                  {latestAnnouncement.message}
                </Text>
              </>
            ) : (
              <Text style={styles.activeDescription}>No announcements yet.</Text>
            )}
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>Modules</Text>

        <Pressable
          onPress={() => navigation.navigate('Employees', { companyId })}
          style={styles.moduleCard}
        >
          <View style={styles.activeShadow} />
          <View style={styles.activeCard}>
            <View style={[styles.iconChip, { backgroundColor: theme.colors.coral }]}>
              {EmployeesIcon}
            </View>
            <Text style={styles.activeTitle}>Employees</Text>
            <Text style={styles.activeDescription}>
              Directory, profiles, and org structure.
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate(leaveTargetScreen, { companyId })}
          style={styles.moduleCard}
        >
          <View style={styles.activeShadow} />
          <View style={styles.activeCard}>
            <View style={[styles.iconChip, { backgroundColor: theme.colors.violet }]}>
              {LeaveIcon}
            </View>
            <Text style={styles.activeTitle}>Leave</Text>
            <Text style={styles.activeDescription}>{leaveSummary}</Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('MyDepartment', { companyId })}
          style={styles.moduleCard}
        >
          <View style={styles.activeShadow} />
          <View style={styles.activeCard}>
            <View style={[styles.iconChip, { backgroundColor: theme.colors.sky }]}>
              {DepartmentIcon}
            </View>
            <Text style={styles.activeTitle}>My Department</Text>
            <Text style={styles.activeDescription}>{deptLabel}</Text>
          </View>
        </Pressable>

        {COMING_SOON_MODULES.map((mod) => (
          <ComingSoonCard
            key={mod.title}
            title={mod.title}
            description={mod.description}
            accent={mod.accent}
            icon={mod.icon}
            style={styles.moduleCard}
          />
        ))}
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
  welcomeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    marginBottom: 28,
  },
  welcome: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.ink,
  },
  statsGrid: {
    gap: 16,
    marginBottom: 28,
  },
  statCard: {
    width: '100%',
  },
  statContent: {
    padding: 20,
  },
  statLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 2,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  statValue: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.ink,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    color: theme.colors.ink,
    marginBottom: 16,
  },
  moduleCard: {
    marginBottom: 16,
    paddingRight: theme.shadow.largeOffset,
    paddingBottom: theme.shadow.largeOffset,
  },
  activeShadow: {
    position: 'absolute',
    top: theme.shadow.largeOffset,
    left: theme.shadow.largeOffset,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    borderRadius: theme.radius.card,
  },
  activeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: theme.radius.card,
    padding: 20,
    ...theme.clayShadow,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.clayShadowButton,
  },
  activeTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 18,
    color: theme.colors.ink,
    marginTop: 14,
  },
  activeDescription: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.ink,
    opacity: 0.8,
    marginTop: 4,
  },
});
