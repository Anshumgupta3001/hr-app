import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDrawerStatus } from '@react-navigation/drawer';
import { useNavigationState } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { authService } from '../services/authService';
import { employeeService } from '../services/employeeService';
import { theme, APP_NAME } from '../theme';

const STORAGE_KEY = 'pg_sidebar_collapsed_groups';

const GROUPS = [
  { label: 'People', keys: ['MyDepartment', 'OrgChart', 'Employees'] },
  {
    label: 'Time & Leave',
    keys: [
      'MyLeave',
      'LeaveRequests',
      'LeavePolicy',
      'Holidays',
      'Attendance',
      'TeamAttendance',
      'RegularizationRequests',
      'AttendanceSettings',
    ],
  },
  {
    label: 'Finance & Assets',
    keys: ['MyExpenses', 'ExpenseClaims', 'Assets', 'MyAssets', 'Payroll'],
  },
  { label: 'Growth', keys: ['Performance', 'TeamReviews', 'ReviewCycles'] },
  {
    label: 'Company',
    keys: ['CompanyFeed', 'PraiseWall', 'CompanySettings', 'Resignations', 'Documents'],
  },
];

const DEFAULT_COLLAPSED = ['Finance & Assets', 'Growth', 'Company'];

function buildCompanyItems(role, companyId, isManager) {
  const items = [
    { key: 'Dashboard', label: 'Dashboard', screen: 'Dashboard' },
    { key: 'MyDepartment', label: 'My Department', screen: 'MyDepartment' },
    { key: 'PraiseWall', label: 'Praise Wall', screen: 'PraiseWall' },
    { key: 'CompanyFeed', label: 'Company Feed', screen: 'CompanyFeed' },
    { key: 'OrgChart', label: 'Org Chart', screen: 'OrgChart' },
  ];

  if (['admin', 'hr'].includes(role)) {
    items.push({ key: 'Employees', label: 'Employees', screen: 'Employees' });
    items.push({ key: 'LeaveRequests', label: 'Leave Requests', screen: 'LeaveRequests' });
    items.push({ key: 'ExpenseClaims', label: 'Expense Claims', screen: 'ExpenseClaims' });
  }
  if (role === 'admin') {
    items.push({ key: 'LeavePolicy', label: 'Leave Policy', screen: 'LeavePolicy' });
  }
  if (['hr', 'manager', 'employee'].includes(role)) {
    items.push({ key: 'MyLeave', label: 'My Leave', screen: 'MyLeave' });
    items.push({ key: 'MyExpenses', label: 'My Expenses', screen: 'MyExpenses' });
  }

  items.push({ key: 'Performance', label: 'Performance', screen: 'Performance' });
  if (isManager) {
    items.push({ key: 'TeamReviews', label: 'Team Reviews', screen: 'TeamReviews' });
  }
  if (role === 'admin') {
    items.push({ key: 'ReviewCycles', label: 'Review Cycles', screen: 'ReviewCycles' });
    items.push({ key: 'Holidays', label: 'Holidays', screen: 'HolidayCalendar' });
  }

  if (['admin', 'hr'].includes(role)) {
    items.push({ key: 'Assets', label: 'Assets', screen: 'AssetInventory' });
  } else {
    items.push({ key: 'MyAssets', label: 'My Assets', screen: 'MyAssets' });
  }

  if (role === 'admin') {
    items.push({ key: 'Resignations', label: 'Resignations', screen: 'Resignations' });
    items.push({ key: 'CompanySettings', label: 'Company Settings', screen: 'CompanySettings' });
  }

  items.push({ key: 'Attendance', label: 'Attendance', screen: 'MyAttendance' });
  if (['admin', 'hr'].includes(role)) {
    items.push({ key: 'TeamAttendance', label: 'Team Attendance', screen: 'TeamAttendance' });
    items.push({
      key: 'RegularizationRequests',
      label: 'Regularization Requests',
      screen: 'RegularizationRequests',
    });
  }
  if (role === 'admin') {
    items.push({
      key: 'AttendanceSettings',
      label: 'Attendance Settings',
      screen: 'AttendanceSettings',
    });
  }

  items.push(
    { key: 'Payroll', label: 'Payroll', disabled: true },
    {
      key: 'Documents',
      label: 'Documents',
      screen: ['admin', 'hr'].includes(role) ? 'DocumentCenter' : 'MyDocuments',
    }
  );

  return items.map((item) => ({
    ...item,
    params: item.screen ? { companyId } : undefined,
  }));
}

const SUPER_ADMIN_ITEMS = [
  { key: 'Companies', label: 'Companies', screen: 'SuperAdminDashboard' },
  { key: 'DefaultLeavePolicy', label: 'Default Leave Policy', screen: 'DefaultLeavePolicy' },
];

function getActiveNestedRouteName(navState) {
  const rootRoute = navState?.routes?.find((r) => r.name === 'Root');
  const nestedState = rootRoute?.state;
  if (!nestedState) return null;
  return nestedState.routes?.[nestedState.index ?? nestedState.routes.length - 1]?.name || null;
}

export default function DrawerContent({ navigation }) {
  const [user, setUser] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [collapsed, setCollapsed] = useState(DEFAULT_COLLAPSED);
  const drawerStatus = useDrawerStatus();
  const navState = useNavigationState((state) => state);
  const activeRoute = getActiveNestedRouteName(navState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setCollapsed(JSON.parse(raw));
        } catch {
          setCollapsed(DEFAULT_COLLAPSED);
        }
      }
    });
  }, []);

  const loadUser = useCallback(() => {
    authService.getCurrentUser().then(async (current) => {
      setUser(current);
      if (current && current.companyId) {
        const employees = await employeeService.getEmployeesByCompany(current.companyId);
        setIsManager(employees.some((e) => e.managerId === current.id));
      }
    });
  }, []);

  if (drawerStatus === 'open' && !user) {
    loadUser();
  }

  function toggleGroup(label) {
    setCollapsed((prev) => {
      const next = prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function handleNavigate(item) {
    navigation.navigate('Root', { screen: item.screen, params: item.params });
    navigation.closeDrawer();
  }

  if (!user) {
    return <View style={styles.wrap} />;
  }

  function renderItem(item) {
    if (item.disabled) {
      return (
        <View key={item.key} style={styles.item}>
          <Text style={styles.itemTextDisabled}>{item.label}</Text>
          <View style={styles.soonPill}>
            <Text style={styles.soonPillText}>Soon</Text>
          </View>
        </View>
      );
    }
    const active = activeRoute === item.screen;
    return (
      <Pressable
        key={item.key}
        onPress={() => handleNavigate(item)}
        style={[styles.item, active && styles.itemActive]}
      >
        <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.label}</Text>
      </Pressable>
    );
  }

  if (user.role === 'superadmin') {
    return (
      <View style={styles.wrap}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.wordmark}>{APP_NAME}</Text>
          <View style={styles.itemList}>{SUPER_ADMIN_ITEMS.map(renderItem)}</View>
        </ScrollView>
      </View>
    );
  }

  const items = buildCompanyItems(user.role, user.companyId, isManager);
  const byKey = Object.fromEntries(items.map((item) => [item.key, item]));

  return (
    <View style={styles.wrap}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.wordmark}>{APP_NAME}</Text>
        <View style={styles.itemList}>
          {byKey.Dashboard && renderItem(byKey.Dashboard)}
          {GROUPS.map((group) => {
            const groupItems = group.keys.map((key) => byKey[key]).filter(Boolean);
            if (groupItems.length === 0) return null;
            const isCollapsed = collapsed.includes(group.label);
            return (
              <View key={group.label}>
                <Pressable
                  onPress={() => toggleGroup(group.label)}
                  style={styles.groupHeader}
                >
                  <Text style={styles.groupLabel}>{group.label}</Text>
                  <Svg
                    width={12}
                    height={12}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={theme.colors.muted}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transform: [{ rotate: isCollapsed ? '-90deg' : '0deg' }] }}
                  >
                    <Path d="M6 9l6 6 6-6" />
                  </Svg>
                </Pressable>
                {!isCollapsed && (
                  <View style={styles.itemList}>{groupItems.map(renderItem)}</View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  scroll: {
    padding: 16,
    paddingTop: 56,
    paddingBottom: 32,
  },
  wordmark: {
    fontFamily: theme.fonts.displayBlack,
    fontSize: 20,
    color: theme.colors.ink,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  itemList: {
    gap: 6,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
  },
  groupLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: theme.colors.muted,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radius.button,
  },
  itemActive: {
    backgroundColor: theme.colors.violet,
    ...theme.clayShadowButton,
  },
  itemText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
  },
  itemTextActive: {
    color: theme.colors.white,
  },
  itemTextDisabled: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.muted,
  },
  soonPill: {
    borderRadius: 999,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  soonPillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.muted,
  },
});
