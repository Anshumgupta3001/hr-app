import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import BackButton from '../components/BackButton';
import { authService } from '../services/authService';
import { leavePolicyService } from '../services/leavePolicyService';
import { leaveBalanceService } from '../services/leaveBalanceService';
import { leaveRequestService } from '../services/leaveRequestService';
import { theme } from '../theme';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function calcTotalDays(startDate, endDate) {
  if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) return 0;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  return Math.round((end - start) / 86400000) + 1;
}

export default function ApplyForLeaveScreen({ navigation, route }) {
  const companyId = route.params?.companyId;
  const [user, setUser] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [balances, setBalances] = useState([]);
  const [leaveTypeId, setLeaveTypeId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const current = await authService.getCurrentUser();
        if (!active) return;
        if (!current || !['hr', 'manager', 'employee'].includes(current.role)) {
          navigation.goBack();
          return;
        }
        const [companyPolicy, myBalances] = await Promise.all([
          leavePolicyService.getCompanyPolicy(companyId),
          leaveBalanceService.getBalances(current.id, companyId),
        ]);
        if (!active) return;
        setUser(current);
        setPolicy(companyPolicy);
        setBalances(myBalances);
        setLeaveTypeId((id) => id || companyPolicy.leaveTypes[0]?.id || null);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, companyId])
  );

  const totalDays = useMemo(
    () => calcTotalDays(startDate, endDate),
    [startDate, endDate]
  );

  if (!user || !policy) {
    return <SafeAreaView style={styles.screen} />;
  }

  const remaining =
    balances.find((b) => b.leaveTypeId === leaveTypeId)?.remaining ?? 0;
  const exceedsBalance = totalDays > 0 && totalDays > remaining;
  const canSubmit = leaveTypeId && totalDays >= 1 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError('');
    setSubmitting(true);
    try {
      await leaveRequestService.createRequest({
        companyId,
        employeeId: user.id,
        leaveTypeId,
        startDate,
        endDate,
        totalDays,
        reason,
      });
      navigation.navigate('MyLeave', { companyId });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <OutlinedCard style={styles.cardWrap}>
            <BackButton />
            <Text style={styles.heading}>Apply for Leave</Text>

            <Text style={styles.label}>Leave Type</Text>
            <View style={styles.pillRow}>
              {policy.leaveTypes.map((t) => {
                const selected = leaveTypeId === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setLeaveTypeId(t.id)}
                    style={[styles.pill, selected && styles.pillSelected]}
                  >
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                      {t.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
            />
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
            />

            {totalDays > 0 && (
              <Text style={styles.totalDays}>Total days: {totalDays}</Text>
            )}
            {exceedsBalance && (
              <Text style={styles.warning}>
                This exceeds your remaining balance of {remaining} day(s) for this
                leave type. You can still submit — your admin makes the final call.
              </Text>
            )}

            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={reason}
              onChangeText={setReason}
              placeholder="A short reason for your leave"
              placeholderTextColor={theme.colors.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <CandyButton
              title="Submit Request"
              variant="primary"
              disabled={!canSubmit}
              onPress={handleSubmit}
              style={styles.submit}
            />
          </OutlinedCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  cardWrap: {
    width: '100%',
  },
  back: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.teal,
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 26,
    color: theme.colors.ink,
    marginBottom: 18,
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
    marginBottom: 16,
  },
  textarea: {
    minHeight: 80,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    borderRadius: 999,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillSelected: {
    backgroundColor: theme.colors.violet,
  },
  pillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
  },
  pillTextSelected: {
    color: theme.colors.white,
  },
  totalDays: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.ink,
    marginBottom: 12,
  },
  warning: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.coral,
    marginBottom: 12,
  },
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.coral,
    marginBottom: 12,
  },
  submit: {
    marginTop: 4,
  },
});
