import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import OutlinedCard from '../components/OutlinedCard';
import ConfettiBackground from '../components/ConfettiBackground';
import NavBar from '../components/NavBar';
import BackButton from '../components/BackButton';
import { authService } from '../services/authService';
import { companyService } from '../services/companyService';
import { employeeService } from '../services/employeeService';
import { documentService } from '../services/documentService';
import { theme } from '../theme';

const DOCUMENT_COLUMNS = [
  { documentType: 'profilePhoto', label: 'Photo' },
  { documentType: 'aadhar', label: 'Aadhar' },
  { documentType: 'pan', label: 'PAN' },
  { documentType: 'passport', label: 'Passport' },
  { documentType: 'bankProof', label: 'Bank' },
];

const NAME_COL_WIDTH = 130;
const DOC_COL_WIDTH = 64;
const OTHER_COL_WIDTH = 64;

export default function DocumentCenterScreen({ navigation, route }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [rows, setRows] = useState([]);

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
          navigation.reset({
            index: 0,
            routes: [
              { name: current.role === 'superadmin' ? 'SuperAdminDashboard' : 'Dashboard' },
            ],
          });
          return;
        }
        const targetId = route.params?.companyId ?? current.companyId;
        if (current.companyId !== targetId) {
          navigation.replace('DocumentCenter', { companyId: current.companyId });
          return;
        }
        const found = await companyService.getCompanyById(targetId);
        if (!active) return;
        if (!found) {
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          return;
        }
        const employees = await employeeService.getEmployeesByCompany(targetId);
        const withDocs = await Promise.all(
          employees.map(async (emp) => {
            const docs = await documentService.getDocumentsForEmployee(emp.id);
            const byType = new Set(docs.map((d) => d.documentType));
            const otherCount = docs.filter((d) => d.documentType === 'other').length;
            return { employee: emp, byType, otherCount };
          })
        );
        if (!active) return;
        setUser(current);
        setCompany(found);
        setCompanyId(targetId);
        setRows(withDocs);
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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ConfettiBackground calm />
      <NavBar user={user} company={company} companyId={companyId} navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <BackButton />
        <Text style={styles.heading}>Document Center</Text>
        <Text style={styles.subheading}>
          A quick overview of who's missing what. Tap a row for the full view.
        </Text>

        <OutlinedCard style={styles.tableCard} contentStyle={styles.tableCardContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.headerRow}>
                <Text style={[styles.headerCell, { width: NAME_COL_WIDTH }]}>Employee</Text>
                {DOCUMENT_COLUMNS.map((col) => (
                  <Text
                    key={col.documentType}
                    style={[styles.headerCell, styles.centerText, { width: DOC_COL_WIDTH }]}
                  >
                    {col.label}
                  </Text>
                ))}
                <Text style={[styles.headerCell, styles.centerText, { width: OTHER_COL_WIDTH }]}>
                  Other
                </Text>
              </View>

              {rows.length === 0 ? (
                <Text style={styles.empty}>No employees yet.</Text>
              ) : (
                rows.map(({ employee, byType, otherCount }, i) => (
                  <Pressable
                    key={employee.id}
                    onPress={() =>
                      navigation.navigate('EmployeeDocuments', {
                        companyId,
                        employeeId: employee.id,
                      })
                    }
                    style={[styles.row, i > 0 && styles.rowBorder]}
                  >
                    <Text
                      style={[styles.nameCell, { width: NAME_COL_WIDTH }]}
                      numberOfLines={1}
                    >
                      {employee.name}
                    </Text>
                    {DOCUMENT_COLUMNS.map((col) => (
                      <Text
                        key={col.documentType}
                        style={[styles.cell, styles.centerText, { width: DOC_COL_WIDTH }]}
                      >
                        {byType.has(col.documentType) ? (
                          <Text style={styles.check}>✓</Text>
                        ) : (
                          <Text style={styles.dash}>—</Text>
                        )}
                      </Text>
                    ))}
                    <View style={[styles.centerText, { width: OTHER_COL_WIDTH }]}>
                      {otherCount > 0 ? (
                        <View style={styles.otherBadge}>
                          <Text style={styles.otherBadgeText}>{otherCount}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.cell, styles.centerText]}>
                          <Text style={styles.dash}>—</Text>
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </ScrollView>
        </OutlinedCard>
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
    fontSize: 26,
    color: theme.colors.ink,
  },
  subheading: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
    marginBottom: 20,
  },
  tableCard: {
    width: '100%',
  },
  tableCardContent: {
    padding: 0,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(51,47,58,0.1)',
  },
  headerCell: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.ink,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  centerText: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(51,47,58,0.06)',
  },
  nameCell: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    paddingHorizontal: 10,
  },
  cell: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    paddingHorizontal: 10,
  },
  check: {
    color: theme.colors.teal,
    fontFamily: theme.fonts.bodyBold,
  },
  dash: {
    color: theme.colors.muted,
  },
  otherBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderRadius: 999,
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  otherBadgeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.violet,
    textAlign: 'center',
  },
  empty: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.muted,
    padding: 16,
  },
});
