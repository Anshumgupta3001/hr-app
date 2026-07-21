import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import AttendanceStatusPill from '../components/AttendanceStatusPill';
import MonthlySummaryCard from '../components/MonthlySummaryCard';
import AttendancePatternStrip from '../components/AttendancePatternStrip';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { attendanceService } from '../services/attendanceService';
import { theme } from '../theme';

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatTime(dateStr) {
  return dateStr
    ? new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';
}

function targetCompletionTime(clockInTime, expectedWorkHours) {
  const target = new Date(clockInTime);
  target.setTime(target.getTime() + expectedWorkHours * 3600000);
  return formatTime(target);
}

async function getLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission was denied.');
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

function CorrectionModal({ record, onClose, onSubmitted }) {
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('Please provide a reason.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await attendanceService.createRegularization({
        date: record.date,
        requestedClockInTime: clockIn ? new Date(`${record.date}T${clockIn}:00`).toISOString() : null,
        requestedClockOutTime: clockOut
          ? new Date(`${record.date}T${clockOut}:00`).toISOString()
          : null,
        reason: reason.trim(),
      });
      onSubmitted();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <OutlinedCard style={styles.modalCard}>
          <Text style={styles.modalTitle}>Request Correction</Text>
          <Text style={styles.modalSubtitle}>For {record.date}</Text>

          <Text style={styles.label}>Proposed Clock In (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={clockIn}
            onChangeText={setClockIn}
            placeholder="09:00"
            placeholderTextColor={theme.colors.muted}
          />
          <Text style={styles.label}>Proposed Clock Out (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={clockOut}
            onChangeText={setClockOut}
            placeholder="18:00"
            placeholderTextColor={theme.colors.muted}
          />
          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={reason}
            onChangeText={setReason}
            placeholder="Forgot to clock in..."
            placeholderTextColor={theme.colors.muted}
            multiline
            numberOfLines={3}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <CandyButton title="Cancel" variant="secondary" small onPress={onClose} />
            <CandyButton
              title="Submit"
              variant="primary"
              small
              disabled={submitting}
              onPress={handleSubmit}
            />
          </View>
        </OutlinedCard>
      </View>
    </Modal>
  );
}

export default function MyAttendanceScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [history, setHistory] = useState([]);
  const [month, setMonth] = useState(currentMonthValue());
  const [summary, setSummary] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [correctionRecord, setCorrectionRecord] = useState(null);

  const todayStr = new Date().toISOString().slice(0, 10);

  const loadAll = useCallback(async (currentUser, targetMonth) => {
    const [shiftPolicy, myHistory, monthSummary] = await Promise.all([
      attendanceService.getShiftPolicy(),
      attendanceService.getMyAttendance(),
      attendanceService.getSummary({ employeeId: currentUser.id, month: targetMonth }),
    ]);
    setPolicy(shiftPolicy);
    setHistory(myHistory);
    setSummary(monthSummary);
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
          navigation.replace('MyAttendance', { companyId: current.companyId });
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
        await loadAll(current, currentMonthValue());
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, loadAll])
  );

  async function reload() {
    setCorrectionRecord(null);
    await loadAll(user, month);
  }

  async function handleMonthChange(delta) {
    const [y, m] = month.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setMonth(newMonth);
    setSummary(await attendanceService.getSummary({ employeeId: user.id, month: newMonth }));
  }

  async function handleClockIn() {
    setActionError('');
    setActionLoading(true);
    try {
      const { latitude, longitude } = await getLocation();
      await attendanceService.clockIn({ latitude, longitude });
      await loadAll(user, month);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClockOut() {
    setActionError('');
    setActionLoading(true);
    try {
      const { latitude, longitude } = await getLocation();
      await attendanceService.clockOut({ latitude, longitude });
      await loadAll(user, month);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (!user || !company || !policy) {
    return <SafeAreaView style={styles.screen} />;
  }

  const todayRecord = history.find((r) => r.date === todayStr) || null;

  function renderTodayWidget() {
    if (!todayRecord || !todayRecord.clockInTime) {
      return (
        <CandyButton
          title={actionLoading ? 'Getting location…' : 'Clock In'}
          variant="primary"
          disabled={actionLoading}
          onPress={handleClockIn}
        />
      );
    }

    if (!todayRecord.clockOutTime) {
      return (
        <View style={{ gap: 10 }}>
          <Text style={styles.bold}>Clocked in at {formatTime(todayRecord.clockInTime)}</Text>
          <Text style={styles.muted}>
            {policy.expectedWorkHours} hours completes at{' '}
            {targetCompletionTime(todayRecord.clockInTime, policy.expectedWorkHours)}
          </Text>
          <CandyButton
            title={actionLoading ? 'Getting location…' : 'Clock Out'}
            variant="teal"
            disabled={actionLoading}
            onPress={handleClockOut}
          />
        </View>
      );
    }

    return (
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.summaryLabel}>Clock In</Text>
          <Text style={styles.summaryValue}>{formatTime(todayRecord.clockInTime)}</Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>Clock Out</Text>
          <Text style={styles.summaryValue}>{formatTime(todayRecord.clockOutTime)}</Text>
        </View>
        <View>
          <Text style={styles.summaryLabel}>Total Hours</Text>
          <Text style={styles.summaryValue}>{todayRecord.totalHours?.toFixed(2)}</Text>
        </View>
        <AttendanceStatusPill status={todayRecord.status} />
      </View>
    );
  }

  const otherHistory = history.filter((r) => r.date !== todayStr);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>My Attendance</Text>

        <OutlinedCard style={styles.todayCard}>
          {renderTodayWidget()}
          {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
        </OutlinedCard>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Monthly Summary</Text>
          <View style={styles.monthSwitcher}>
            <Pressable onPress={() => handleMonthChange(-1)} style={styles.monthArrow}>
              <Text style={styles.monthArrowText}>‹</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{month}</Text>
            <Pressable onPress={() => handleMonthChange(1)} style={styles.monthArrow}>
              <Text style={styles.monthArrowText}>›</Text>
            </Pressable>
          </View>
        </View>

        {summary && (
          <>
            <MonthlySummaryCard summary={summary} />
            <OutlinedCard style={styles.patternCard}>
              <AttendancePatternStrip pattern={summary.pattern} />
            </OutlinedCard>
          </>
        )}

        <Text style={styles.sectionTitle}>History</Text>
        {otherHistory.length === 0 ? (
          <Text style={styles.empty}>No attendance history yet.</Text>
        ) : (
          otherHistory.map((r) => (
            <OutlinedCard key={r.id} style={styles.historyCard} contentStyle={styles.historyContent}>
              <View style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyDate}>{r.date}</Text>
                  <Text style={styles.historyTimes}>
                    {r.clockInTime ? formatTime(r.clockInTime) : '—'} to{' '}
                    {r.clockOutTime ? formatTime(r.clockOutTime) : '—'}
                    {r.totalHours != null ? ` · ${r.totalHours.toFixed(2)}h` : ''}
                  </Text>
                </View>
                <View style={{ gap: 8, alignItems: 'flex-end' }}>
                  <AttendanceStatusPill status={r.status} />
                  {['absent', 'incomplete'].includes(r.status) && (
                    <CandyButton
                      title="Request Correction"
                      variant="primary"
                      small
                      onPress={() => setCorrectionRecord(r)}
                    />
                  )}
                </View>
              </View>
            </OutlinedCard>
          ))
        )}
      </ScrollView>

      {correctionRecord && (
        <CorrectionModal
          record={correctionRecord}
          onClose={() => setCorrectionRecord(null)}
          onSubmitted={reload}
        />
      )}
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
  todayCard: {
    marginBottom: 28,
  },
  bold: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.ink,
  },
  muted: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.muted,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.muted,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    color: theme.colors.ink,
    marginTop: 8,
    marginBottom: 16,
  },
  monthSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowText: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  monthLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
  },
  patternCard: {
    marginTop: 16,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.muted,
  },
  historyCard: {
    marginBottom: 16,
  },
  historyContent: {
    padding: 18,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyDate: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  historyTimes: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.coral,
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(51,47,58,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 19,
    color: theme.colors.ink,
  },
  modalSubtitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 16,
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    marginBottom: 6,
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
    marginBottom: 14,
  },
  textarea: {
    minHeight: 70,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
});
