import { useCallback, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import OutlinedCard from '../components/OutlinedCard';
import CandyButton from '../components/CandyButton';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { attendanceService } from '../services/attendanceService';
import { theme } from '../theme';

async function getLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission was denied.');
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

function LocationsSection({ locations, onReload }) {
  const [pendingCoords, setPendingCoords] = useState(null);
  const [name, setName] = useState('');
  const [radius, setRadius] = useState('500');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleUseCurrentLocation() {
    setError('');
    try {
      const coords = await getLocation();
      setPendingCoords(coords);
      setName('');
      setRadius('500');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSave() {
    if (!pendingCoords || !name.trim()) return;
    setSaving(true);
    setError('');
    try {
      await attendanceService.addLocation({
        name: name.trim(),
        latitude: pendingCoords.latitude,
        longitude: pendingCoords.longitude,
        radiusMeters: Number(radius) || 500,
      });
      setPendingCoords(null);
      await onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    await attendanceService.removeLocation(id);
    await onReload();
  }

  return (
    <OutlinedCard style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Locations</Text>
        <CandyButton
          title="Use my current location"
          variant="primary"
          small
          onPress={handleUseCurrentLocation}
        />
      </View>

      {pendingCoords && (
        <View style={styles.inlineForm}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Main Office"
            placeholderTextColor={theme.colors.muted}
          />
          <Text style={styles.label}>Radius (m)</Text>
          <TextInput
            style={styles.input}
            value={radius}
            onChangeText={setRadius}
            keyboardType="numeric"
          />
          <CandyButton
            title="Save"
            variant="teal"
            small
            disabled={!name.trim() || saving}
            onPress={handleSave}
          />
        </View>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {locations.length === 0 ? (
        <Text style={styles.empty}>No locations configured yet.</Text>
      ) : (
        locations.map((loc) => (
          <View key={loc.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{loc.name}</Text>
              <Text style={styles.rowSub}>
                {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)} · {loc.radiusMeters}m radius
              </Text>
            </View>
            <CandyButton title="Remove" variant="primary" small onPress={() => handleRemove(loc.id)} />
          </View>
        ))
      )}
    </OutlinedCard>
  );
}

function ShiftTimingSection({ policy, onReload }) {
  const [form, setForm] = useState(policy);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await attendanceService.updateShiftPolicy({
        expectedWorkHours: Number(form.expectedWorkHours),
      });
      await onReload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <OutlinedCard style={styles.section}>
      <Text style={styles.sectionTitle}>Shift Timing</Text>
      <Text style={styles.label}>Expected Work Hours</Text>
      <TextInput
        style={styles.input}
        value={String(form.expectedWorkHours)}
        onChangeText={(v) => update('expectedWorkHours', v)}
        keyboardType="numeric"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <CandyButton title="Save Shift Policy" variant="teal" disabled={saving} onPress={handleSave} />
    </OutlinedCard>
  );
}

function ExemptionsSection({ exemptions, employees, onReload }) {
  const [employeeId, setEmployeeId] = useState(null);
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function employeeName(id) {
    const emp = employees.find((e) => e.id === id);
    return emp ? emp.name : 'Former employee';
  }

  async function handleAdd() {
    if (!employeeId || !date) return;
    setError('');
    try {
      await attendanceService.createExemption({ employeeId, date, reason: reason.trim() });
      setEmployeeId(null);
      setDate('');
      setReason('');
      await onReload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(id) {
    await attendanceService.removeExemption(id);
    await onReload();
  }

  return (
    <OutlinedCard style={styles.section}>
      <Text style={styles.sectionTitle}>Remote Day Exceptions</Text>

      <Text style={styles.label}>Employee</Text>
      <View style={styles.pillRow}>
        {employees.map((emp) => {
          const selected = employeeId === emp.id;
          return (
            <Pressable
              key={emp.id}
              onPress={() => setEmployeeId(emp.id)}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{emp.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="2026-07-21"
        placeholderTextColor={theme.colors.muted}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Reason</Text>
      <TextInput
        style={styles.input}
        value={reason}
        onChangeText={setReason}
        placeholder="WFH"
        placeholderTextColor={theme.colors.muted}
      />
      <CandyButton
        title="+ Add Exception"
        variant="mustard"
        disabled={!employeeId || !date}
        onPress={handleAdd}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {exemptions.length === 0 ? (
        <Text style={[styles.empty, { marginTop: 16 }]}>No exceptions recorded.</Text>
      ) : (
        exemptions.map((ex) => (
          <View key={ex.id} style={styles.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowName}>{employeeName(ex.employeeId)}</Text>
              <Text style={styles.rowSub}>
                {ex.date}
                {ex.reason ? ` · ${ex.reason}` : ''}
              </Text>
            </View>
            <CandyButton title="Remove" variant="primary" small onPress={() => handleRemove(ex.id)} />
          </View>
        ))
      )}
    </OutlinedCard>
  );
}

export default function AttendanceSettingsScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [exemptions, setExemptions] = useState([]);

  const loadAll = useCallback(async () => {
    const [locs, shiftPolicy, exs] = await Promise.all([
      attendanceService.getLocations(),
      attendanceService.getShiftPolicy(),
      attendanceService.getExemptions(),
    ]);
    setLocations(locs);
    setPolicy(shiftPolicy);
    setExemptions(exs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      async function load() {
        const current = await authService.getCurrentUser();
        if (!active) return;
        if (!current || current.role !== 'admin') {
          navigation.goBack();
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        const found = await companyService.getCompanyById(targetId);
        if (!active || !found) return;
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setEmployees(await employeeService.getEmployeesByCompany(targetId));
        await loadAll();
      }
      load();
      return () => {
        active = false;
      };
    }, [navigation, route.params?.companyId, loadAll])
  );

  if (!user || !company || !policy) {
    return <SafeAreaView style={styles.screen} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Attendance Settings</Text>
        <LocationsSection locations={locations} onReload={loadAll} />
        <ShiftTimingSection policy={policy} onReload={loadAll} />
        <ExemptionsSection exemptions={exemptions} employees={employees} onReload={loadAll} />
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
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 19,
    color: theme.colors.ink,
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
  inlineForm: {
    backgroundColor: theme.colors.inputFill,
    borderRadius: theme.radius.card,
    padding: 16,
    marginBottom: 16,
  },
  error: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.coral,
    marginBottom: 12,
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.muted,
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.inputFill,
    borderRadius: theme.radius.button,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 10,
    gap: 10,
  },
  rowName: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 14,
    color: theme.colors.ink,
  },
  rowSub: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 2,
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
  },
  pillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
  },
  pillTextSelected: {
    color: theme.colors.white,
  },
});
