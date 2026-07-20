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
import AssetRow from '../components/AssetRow';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { assetService, ASSET_TYPES } from '../services/assetService';
import { theme } from '../theme';

export default function AssetInventoryScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  const [assetType, setAssetType] = useState(ASSET_TYPES[0]);
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [assigningId, setAssigningId] = useState(null);

  const loadAssets = useCallback(async (cId) => {
    setAssets(await assetService.getAssetsByCompany(cId));
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
        if (!['admin', 'hr'].includes(current.role)) {
          navigation.replace(
            current.role === 'superadmin' ? 'SuperAdminDashboard' : 'MyAssets',
            current.role === 'superadmin' ? undefined : { companyId: current.companyId }
          );
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (current.companyId !== targetId) {
          navigation.replace('AssetInventory', { companyId: current.companyId });
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
        setEmployees(await employeeService.getEmployeesByCompany(targetId));
        await loadAssets(targetId);
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, loadAssets])
  );

  if (!user || !company) {
    return <SafeAreaView style={styles.screen} />;
  }

  const canAdd = name.trim();

  async function handleAdd() {
    if (!canAdd) return;
    await assetService.createAsset({ companyId, assetType, name, serialNumber });
    setName('');
    setSerialNumber('');
    await loadAssets(companyId);
  }

  async function handleAssign(assetId, employeeId) {
    await assetService.assignAsset(assetId, employeeId);
    setAssigningId(null);
    await loadAssets(companyId);
  }

  async function handleReturn(assetId) {
    await assetService.returnAsset(assetId);
    await loadAssets(companyId);
  }

  function assigneeOf(asset) {
    return employees.find((e) => e.id === asset.assignedToEmployeeId) || null;
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
          <Text style={styles.heading}>Asset Inventory</Text>

          <OutlinedCard style={styles.card} contentStyle={styles.cardContent}>
            <Text style={styles.sectionTitle}>+ Add Asset</Text>
            <Text style={styles.label}>Type</Text>
            <View style={styles.pillRow}>
              {ASSET_TYPES.map((t) => {
                const selected = assetType === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setAssetType(t)}
                    style={[styles.pill, selected && styles.pillSelected]}
                  >
                    <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="MacBook Air M2"
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.label}>Serial Number</Text>
            <TextInput
              style={styles.input}
              value={serialNumber}
              onChangeText={setSerialNumber}
              placeholder="C02XR4..."
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="characters"
            />
            <CandyButton
              title="Add Asset"
              variant="primary"
              disabled={!canAdd}
              onPress={handleAdd}
            />
          </OutlinedCard>

          {assets.length === 0 ? (
            <Text style={styles.empty}>No assets tracked yet.</Text>
          ) : (
            assets.map((asset) => {
              const assignee = assigneeOf(asset);
              const needsReturn = Boolean(
                assignee && ['on_notice', 'exited'].includes(assignee.employmentStatus)
              );
              return (
                <AssetRow
                  key={asset.id}
                  asset={asset}
                  assignedName={assignee ? assignee.name : null}
                  needsReturn={needsReturn}
                  style={styles.assetCard}
                  actions={
                    asset.status === 'available' ? (
                      assigningId === asset.id ? (
                        <View style={styles.assignRow}>
                          {employees
                            .filter((e) => e.employmentStatus !== 'exited')
                            .map((e) => (
                              <Pressable
                                key={e.id}
                                onPress={() => handleAssign(asset.id, e.id)}
                                style={styles.assignPill}
                              >
                                <Text style={styles.assignPillText}>{e.name}</Text>
                              </Pressable>
                            ))}
                        </View>
                      ) : (
                        <CandyButton
                          title="Assign"
                          variant="teal"
                          small
                          pill
                          onPress={() => setAssigningId(asset.id)}
                        />
                      )
                    ) : (
                      <CandyButton
                        title="Mark Returned"
                        variant="secondary"
                        small
                        pill
                        onPress={() => handleReturn(asset.id)}
                      />
                    )
                  }
                />
              );
            })
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
    marginBottom: 20,
  },
  card: {
    marginBottom: 20,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 17,
    color: theme.colors.ink,
    marginBottom: 14,
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
    marginBottom: 14,
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
    marginBottom: 14,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  assetCard: {
    marginBottom: 14,
  },
  assignRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  assignPill: {
    borderRadius: 999,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  assignPillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.ink,
  },
});
