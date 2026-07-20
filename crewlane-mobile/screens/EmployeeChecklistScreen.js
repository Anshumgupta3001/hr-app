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
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import ChecklistItem from '../components/ChecklistItem';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { checklistService } from '../services/checklistService';
import { theme } from '../theme';

function TaskSection({ title, tasks, onToggle, onAdd }) {
  const [newTitle, setNewTitle] = useState('');
  const done = tasks.filter((t) => t.isCompleted).length;

  return (
    <OutlinedCard style={styles.sectionCard} contentStyle={styles.sectionContent}>
      <View style={styles.sectionTop}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>
          {done}/{tasks.length} done
        </Text>
      </View>
      <View style={styles.taskList}>
        {tasks.map((task) => (
          <ChecklistItem key={task.id} task={task} onToggle={onToggle} />
        ))}
      </View>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, styles.addInput]}
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="Add a custom task"
          placeholderTextColor={theme.colors.muted}
        />
        <CandyButton
          title="+ Add"
          variant="mustard"
          small
          pill
          disabled={!newTitle.trim()}
          onPress={() => {
            onAdd(newTitle);
            setNewTitle('');
          }}
        />
      </View>
    </OutlinedCard>
  );
}

export default function EmployeeChecklistScreen({ navigation, route }) {
  const employeeId = route.params?.employeeId;
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);

  const loadTasks = useCallback(async () => {
    setTasks(await checklistService.getTasksForEmployee(employeeId));
  }, [employeeId]);

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
        if (!['admin', 'hr'].includes(current.role)) {
          navigation.goBack();
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (current.companyId !== targetId) {
          navigation.goBack();
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        const emp = await employeeService.getEmployeeById(employeeId);
        if (!active) return;
        if (!found || !emp || emp.companyId !== targetId) {
          navigation.goBack();
          return;
        }
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setEmployee(emp);
        await loadTasks();
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, employeeId, loadTasks])
  );

  if (!user || !company || !employee) {
    return <SafeAreaView style={styles.screen} />;
  }

  const onboarding = tasks.filter((t) => t.type === 'onboarding');
  const offboarding = tasks.filter((t) => t.type === 'offboarding');

  async function handleToggle(taskId) {
    await checklistService.toggleTask(taskId);
    await loadTasks();
  }

  async function handleAdd(type, title) {
    await checklistService.addTask({ companyId, employeeId, type, title });
    await loadTasks();
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
          <Text style={styles.heading}>
            {employee.name} <Text style={styles.headingSub}>— Checklist</Text>
          </Text>

          {onboarding.length > 0 && (
            <TaskSection
              title="Onboarding"
              tasks={onboarding}
              onToggle={handleToggle}
              onAdd={(title) => handleAdd('onboarding', title)}
            />
          )}
          {offboarding.length > 0 && (
            <TaskSection
              title="Offboarding"
              tasks={offboarding}
              onToggle={handleToggle}
              onAdd={(title) => handleAdd('offboarding', title)}
            />
          )}
          {onboarding.length === 0 && offboarding.length === 0 && (
            <Text style={styles.empty}>No checklist tasks for this employee yet.</Text>
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
    fontSize: 26,
    color: theme.colors.ink,
    marginBottom: 20,
  },
  headingSub: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 20,
    color: theme.colors.muted,
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionContent: {
    padding: 20,
  },
  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    color: theme.colors.ink,
  },
  sectionCount: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.muted,
  },
  taskList: {
    gap: 10,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.ink,
  },
  addInput: {
    flex: 1,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
  },
});
