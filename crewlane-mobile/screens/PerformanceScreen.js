import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
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
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import GoalRow from '../components/GoalRow';
import ReviewCard from '../components/ReviewCard';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { performanceService } from '../services/performanceService';
import { theme } from '../theme';

export default function PerformanceScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [goals, setGoals] = useState([]);
  const [review, setReview] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [selfRating, setSelfRating] = useState(3);
  const [selfComments, setSelfComments] = useState('');

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
          navigation.replace('Performance', { companyId: current.companyId });
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const activeCycle = await performanceService.getActiveCycle(targetId);
        if (!active) return;
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setCycle(activeCycle);
        if (activeCycle) {
          setGoals(await performanceService.getGoals(current.id, activeCycle.id));
          setReview(
            await performanceService.getOrCreateReview(targetId, activeCycle.id, current.id)
          );
        }
        setLoaded(true);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId])
  );

  if (!user || !company || !loaded) {
    return <SafeAreaView style={styles.screen} />;
  }

  async function handleAddGoal() {
    if (!goalTitle.trim()) return;
    await performanceService.addGoal({
      companyId,
      employeeId: user.id,
      cycleId: cycle.id,
      title: goalTitle,
      description: goalDescription,
    });
    setGoalTitle('');
    setGoalDescription('');
    setGoals(await performanceService.getGoals(user.id, cycle.id));
  }

  async function handleGoalUpdate(goalId, updates) {
    await performanceService.updateGoal(goalId, updates);
    setGoals(await performanceService.getGoals(user.id, cycle.id));
  }

  async function handleSubmitSelf() {
    const updated = await performanceService.submitSelfReview(review.id, {
      selfRating,
      selfComments,
    });
    setReview(updated);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <BackButton />
          <Text style={styles.heading}>Performance</Text>

          {!cycle ? (
            <Text style={styles.empty}>
              No active review cycle right now. Check back once your admin starts one.
            </Text>
          ) : (
            <>
              <Text style={styles.cycleMeta}>
                {cycle.name} · {cycle.startDate} to {cycle.endDate}
              </Text>

              <Text style={styles.sectionTitle}>My Goals</Text>
              {goals.map((goal) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                  editable
                  onUpdate={handleGoalUpdate}
                  style={styles.goalCard}
                />
              ))}
              <OutlinedCard style={styles.goalCard} contentStyle={styles.addGoalContent}>
                <TextInput
                  style={styles.input}
                  value={goalTitle}
                  onChangeText={setGoalTitle}
                  placeholder="New goal title"
                  placeholderTextColor={theme.colors.muted}
                />
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={goalDescription}
                  onChangeText={setGoalDescription}
                  placeholder="Description"
                  placeholderTextColor={theme.colors.muted}
                  multiline
                  textAlignVertical="top"
                />
                <CandyButton
                  title="+ Add Goal"
                  variant="mustard"
                  small
                  pill
                  disabled={!goalTitle.trim()}
                  onPress={handleAddGoal}
                />
              </OutlinedCard>

              <Text style={styles.sectionTitle}>My Review</Text>
              {review.status === 'pending_self' ? (
                <OutlinedCard contentStyle={styles.selfContent}>
                  <Text style={styles.label}>Rating (1–5)</Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Pressable
                        key={n}
                        onPress={() => setSelfRating(n)}
                        style={[
                          styles.ratingPill,
                          selfRating === n && styles.ratingPillSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.ratingText,
                            selfRating === n && styles.ratingTextSelected,
                          ]}
                        >
                          {n}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.label}>Comments</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={selfComments}
                    onChangeText={setSelfComments}
                    placeholder="How did this cycle go for you?"
                    placeholderTextColor={theme.colors.muted}
                    multiline
                    textAlignVertical="top"
                  />
                  <CandyButton
                    title="Submit Self-Review"
                    variant="primary"
                    onPress={handleSubmitSelf}
                    style={styles.submit}
                  />
                </OutlinedCard>
              ) : (
                <ReviewCard title="Your Review" review={review} />
              )}
            </>
          )}
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
    padding: 24,
    paddingBottom: 48,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 28,
    color: theme.colors.ink,
  },
  cycleMeta: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 19,
    color: theme.colors.ink,
    marginTop: 24,
    marginBottom: 14,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
    marginTop: 16,
  },
  goalCard: {
    marginBottom: 14,
  },
  addGoalContent: {
    padding: 18,
  },
  selfContent: {
    padding: 20,
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    marginBottom: 8,
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.ink,
    marginBottom: 12,
  },
  textarea: {
    minHeight: 70,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  ratingPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPillSelected: {
    backgroundColor: theme.colors.violet,
    ...theme.clayShadowButton,
  },
  ratingText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.ink,
  },
  ratingTextSelected: {
    color: theme.colors.white,
  },
  submit: {
    marginTop: 4,
  },
});
