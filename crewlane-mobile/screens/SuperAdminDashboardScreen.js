import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import CandyButton from '../components/CandyButton';
import CompanyCard from '../components/CompanyCard';
import OutlinedCard from '../components/OutlinedCard';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { theme } from '../theme';

function DeleteCompanyDialog({ company, onCancel, onConfirm }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const canConfirm = typed.trim() === company.name && !deleting;

  async function handleConfirm() {
    if (!canConfirm) return;
    setDeleting(true);
    await onConfirm();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.dialogOverlay}>
        <OutlinedCard style={styles.dialogCard} contentStyle={styles.dialogContent}>
          <Text style={styles.dialogHeading}>Delete company</Text>
          <Text style={styles.dialogBody}>
            This permanently deletes <Text style={styles.dialogBold}>{company.name}</Text>
            {' '}— every employee, leave policy, leave request, and notification tied to
            it. This cannot be undone.
          </Text>
          <Text style={styles.dialogLabel}>
            Type <Text style={styles.dialogBold}>{company.name}</Text> to confirm
          </Text>
          <TextInput
            style={styles.dialogInput}
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
          />
          <View style={styles.dialogActions}>
            <CandyButton title="Cancel" variant="secondary" onPress={onCancel} style={styles.dialogButton} />
            <CandyButton
              title={deleting ? 'Deleting…' : 'Delete company'}
              variant="primary"
              disabled={!canConfirm}
              onPress={handleConfirm}
              style={styles.dialogButton}
            />
          </View>
        </OutlinedCard>
      </View>
    </Modal>
  );
}

export default function SuperAdminDashboardScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const twoColumns = width >= 700;
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadCompanies = useCallback(async () => {
    const [allCompanies, allEmployees] = await Promise.all([
      companyService.getAllCompanies(),
      employeeService.getAllEmployees(),
    ]);
    setCompanies(allCompanies);
    setEmployees(allEmployees);
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
        if (current.role !== 'superadmin') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard', params: { companyId: current.companyId } }],
          });
          return;
        }
        setUser(current);
        await loadCompanies();
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, loadCompanies])
  );

  if (!user) {
    return <SafeAreaView style={styles.screen} />;
  }

  async function handleDeleteConfirm() {
    await companyService.deleteCompany(deleteTarget.id);
    setDeleteTarget(null);
    await loadCompanies();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground />
      <NavBar user={user} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Companies</Text>
          <CandyButton
            title="+ Create Company"
            variant="primary"
            small
            pill
            onPress={() => navigation.navigate('CreateCompany')}
          />
        </View>

        {companies.length === 0 ? (
          <Text style={styles.empty}>
            No companies yet. Create the first one to get started.
          </Text>
        ) : (
          <View style={styles.grid}>
            {companies.map((company) => {
              const companyEmployees = employees.filter(
                (e) => e.companyId === company.id && e.role !== 'superadmin'
              );
              const admin = companyEmployees.find((e) => e.role === 'admin') || null;
              return (
                <CompanyCard
                  key={company.id}
                  company={company}
                  employeeCount={companyEmployees.length}
                  admin={admin}
                  onEdit={() => navigation.navigate('EditCompany', { companyId: company.id })}
                  onDelete={() => setDeleteTarget(company)}
                  style={twoColumns ? styles.cardHalf : styles.cardFull}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {deleteTarget && (
        <DeleteCompanyDialog
          company={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  heading: {
    fontFamily: theme.fonts.display,
    fontSize: 30,
    color: theme.colors.ink,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
    marginTop: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  cardFull: {
    width: '100%',
  },
  cardHalf: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(51,47,58,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
  },
  dialogContent: {
    padding: 24,
  },
  dialogHeading: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
    color: theme.colors.ink,
    marginBottom: 8,
  },
  dialogBody: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    lineHeight: 19,
    marginBottom: 16,
  },
  dialogBold: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.ink,
  },
  dialogLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    marginBottom: 8,
  },
  dialogInput: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.ink,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  dialogButton: {
    flex: 1,
  },
});
