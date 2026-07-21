import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import AttendanceStatusPill from '../components/AttendanceStatusPill';
import AttendancePatternStrip from '../components/AttendancePatternStrip';
import CurrentlyInWidget from '../components/CurrentlyInWidget';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { theme } from '../theme';

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatTime(dateStr) {
  return dateStr
    ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
}

export default function TeamAttendanceScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [view, setView] = useState('daily');
  const [date, setDate] = useState(todayValue());
  const [month, setMonth] = useState(currentMonthValue());
  const [dailyRecords, setDailyRecords] = useState([]);
  const [monthlySummaries, setMonthlySummaries] = useState([]);
  const [currentlyIn, setCurrentlyIn] = useState([]);
  const [loading, setLoading] = useState(false);

  function employeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  const loadDaily = useCallback(async (targetDate) => {
    setLoading(true);
    setDailyRecords(await attendanceService.getTeamForDate(targetDate));
    setLoading(false);
  }, []);

  const loadMonthly = useCallback(async (targetMonth, employeeList) => {
    setLoading(true);
    const summaries = await Promise.all(
      employeeList.map(async (emp) => ({
        employee: emp,
        summary: await attendanceService.getSummary({ employeeId: emp.id, month: targetMonth }),
      }))
    );
    setMonthlySummaries(summaries);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const current = await authService.getCurrentUser();
        if (!active) return;
        if (!current || !['admin', 'hr'].includes(current.role)) {
          navigation.goBack();
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        const found = await companyService.getCompanyById(targetId);
        if (!active || !found) return;
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        const emps = await employeeService.getEmployeesByCompany(targetId);
        if (!active) return;
        setEmployees(emps);
        setCurrentlyIn(await attendanceService.getCurrentlyIn());
        await loadDaily(todayValue());
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, loadDaily])
  );

  async function handleDateChange(newDate) {
    setDate(newDate);
    await loadDaily(newDate);
  }

  async function handleViewChange(newView) {
    setView(newView);
    if (newView === 'monthly' && monthlySummaries.length === 0) {
      await loadMonthly(month, employees);
    }
  }

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Team Attendance</Text>

        <CurrentlyInWidget records={currentlyIn} employees={employees} />

        <View style={styles.tabRow}>
          {['daily', 'monthly'].map((v) => (
            <Pressable
              key={v}
              onPress={() => handleViewChange(v)}
              style={[styles.tab, view === v && styles.tabActive]}
            >
              <Text style={[styles.tabText, view === v && styles.tabTextActive]}>{v}</Text>
            </Pressable>
          ))}
        </View>

        {view === 'daily' ? (
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={handleDateChange}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="none"
          />
        ) : (
          <TextInput
            style={styles.input}
            value={month}
            onChangeText={(v) => {
              setMonth(v);
              if (/^\d{4}-\d{2}$/.test(v)) loadMonthly(v, employees);
            }}
            placeholder="YYYY-MM"
            placeholderTextColor={theme.colors.muted}
            autoCapitalize="none"
          />
        )}

        {loading && <Text style={styles.empty}>Loading…</Text>}

        {!loading && view === 'daily' &&
          (dailyRecords.length === 0 ? (
            <Text style={styles.empty}>No attendance records for this date.</Text>
          ) : (
            dailyRecords.map((r) => (
              <OutlinedCard key={r.id} style={styles.rowCard} contentStyle={styles.rowCardContent}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{employeeName(r.employeeId)}</Text>
                    <Text style={styles.rowSub}>
                      {formatTime(r.clockInTime)}
                      {r.clockInDistanceMeters != null ? ` · ${r.clockInDistanceMeters}m` : ''} →{' '}
                      {formatTime(r.clockOutTime)}
                      {r.clockOutDistanceMeters != null ? ` · ${r.clockOutDistanceMeters}m` : ''}
                    </Text>
                    <Text style={styles.rowSub}>
                      {r.totalHours != null ? `${r.totalHours.toFixed(2)}h` : ''}
                    </Text>
                  </View>
                  <AttendanceStatusPill status={r.status} />
                </View>
              </OutlinedCard>
            ))
          ))}

        {!loading && view === 'monthly' &&
          monthlySummaries.map(({ employee, summary }) => (
            <OutlinedCard key={employee.id} style={styles.rowCard}>
              <Text style={styles.rowName}>{employee.name}</Text>
              <Text style={styles.rowSub}>
                Present {summary.presentDays} · Early Leave {summary.earlyLeaveDays} · Incomplete{' '}
                {summary.incompleteDays} · Absent {summary.absentDays} · Hours{' '}
                {summary.totalHoursWorked} · {summary.attendancePercentage}%
              </Text>
              <View style={{ marginTop: 12 }}>
                <AttendancePatternStrip pattern={summary.pattern} />
              </View>
            </OutlinedCard>
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
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.ink,
    marginBottom: 20,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    marginBottom: 12,
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.white,
  },
  tabActive: {
    backgroundColor: theme.colors.violet,
  },
  tabText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    textTransform: 'capitalize',
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
    marginBottom: 16,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.muted,
  },
  rowCard: {
    marginBottom: 14,
  },
  rowCardContent: {
    padding: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  rowName: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  rowSub: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
});
