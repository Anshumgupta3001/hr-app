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
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { expenseService, EXPENSE_CATEGORIES } from '../services/expenseService';
import { theme } from '../theme';

export default function SubmitExpenseScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [dateIncurred, setDateIncurred] = useState('');
  const [description, setDescription] = useState('');
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
        const targetId = route.params?.companyId ?? current.companyId;
        if (current.companyId !== targetId) {
          navigation.goBack();
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.goBack();
          return;
        }
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
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

  const canSubmit = category && Number(amount) > 0 && dateIncurred;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError('');
    try {
      await expenseService.createClaim({
        companyId,
        employeeId: user.id,
        category,
        amount,
        dateIncurred,
        description,
      });
      navigation.navigate('MyExpenses', { companyId });
    } catch (err) {
      setError(err.message);
    }
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
          <OutlinedCard style={styles.cardWrap}>
            <BackButton />
            <Text style={styles.heading}>Submit Expense</Text>

            <Text style={styles.label}>Category</Text>
            <View style={styles.pillRow}>
              {EXPENSE_CATEGORIES.map((c) => {
                const selected = category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[styles.pill, selected && styles.pillSelected]}
                  >
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="1500"
              placeholderTextColor={theme.colors.muted}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Date Incurred (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={dateIncurred}
              onChangeText={setDateIncurred}
              placeholder="2026-07-15"
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Vendor name, receipt number, what it was for"
              placeholderTextColor={theme.colors.muted}
              multiline
              textAlignVertical="top"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <CandyButton
              title="Submit Claim"
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
    padding: 24,
    paddingBottom: 48,
  },
  cardWrap: {
    width: '100%',
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
    ...theme.clayShadowButton,
  },
  pillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
  },
  pillTextSelected: {
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
  textarea: {
    minHeight: 80,
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
