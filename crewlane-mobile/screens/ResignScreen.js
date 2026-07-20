import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import BackButton from '../components/BackButton';
import { authService } from '../services/authService';
import { resignationService } from '../services/resignationService';
import { theme } from '../theme';

export default function ResignScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [proposedLastWorkingDay, setProposedLastWorkingDay] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
          navigation.goBack();
          return;
        }
        const requests = await resignationService.getByEmployee(current.id);
        if (!active) return;
        setUser(current);
        setExisting(requests[0] || null);
        setLoaded(true);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation])
  );

  if (!user || !loaded) {
    return <SafeAreaView style={styles.screen} />;
  }

  const canSubmit = proposedLastWorkingDay && reason.trim();

  async function handleSubmit() {
    if (!canSubmit) return;
    const created = await resignationService.submitResignation({
      companyId: user.companyId,
      employeeId: user.id,
      proposedLastWorkingDay,
      reason,
    });
    setExisting(created);
    setSubmitted(true);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ConfettiBackground calm />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <OutlinedCard style={styles.cardWrap}>
            <BackButton />
            <Text style={styles.heading}>Resign</Text>

            {existing ? (
              <View>
                {submitted && (
                  <Text style={styles.success}>Your resignation has been submitted.</Text>
                )}
                <Text style={styles.body}>
                  You submitted a resignation on{' '}
                  {new Date(existing.submittedAt).toLocaleDateString()} with a proposed
                  last working day of{' '}
                  <Text style={styles.bold}>{existing.proposedLastWorkingDay}</Text>.
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        existing.status === 'pending'
                          ? theme.colors.mustard
                          : theme.colors.teal,
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {existing.status === 'pending'
                      ? 'AWAITING ACKNOWLEDGMENT'
                      : 'ACKNOWLEDGED'}
                  </Text>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.body}>
                  This sends a resignation request to your admin. They'll acknowledge it
                  and work out your notice period with you.
                </Text>
                <Text style={styles.label}>Proposed Last Working Day (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={proposedLastWorkingDay}
                  onChangeText={setProposedLastWorkingDay}
                  placeholder="2026-08-31"
                  placeholderTextColor={theme.colors.muted}
                  autoCapitalize="none"
                />
                <Text style={styles.label}>Reason</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Why are you leaving?"
                  placeholderTextColor={theme.colors.muted}
                  multiline
                  textAlignVertical="top"
                />
                <CandyButton
                  title="Submit Resignation"
                  variant="primary"
                  disabled={!canSubmit}
                  onPress={handleSubmit}
                  style={styles.submit}
                />
              </>
            )}
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
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 27,
    color: theme.colors.ink,
    marginBottom: 10,
  },
  body: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 19,
    marginBottom: 16,
  },
  bold: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.ink,
  },
  success: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.teal,
    marginBottom: 10,
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
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    ...theme.clayShadowButton,
  },
  statusText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
  },
  submit: {
    marginTop: 4,
  },
});
