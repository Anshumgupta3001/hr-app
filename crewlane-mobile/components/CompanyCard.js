import { View, Text, StyleSheet } from 'react-native';
import OutlinedCard from './OutlinedCard';
import CandyButton from './CandyButton';
import { theme } from '../theme';

export default function CompanyCard({ company, employeeCount, admin, onEdit, onDelete, style }) {
  return (
    <OutlinedCard style={style} contentStyle={styles.content}>
      <Text style={styles.name}>{company.name}</Text>
      <Text style={styles.industry}>{company.industry || '—'}</Text>
      <View style={styles.countPill}>
        <Text style={styles.countPillText}>
          {employeeCount} {employeeCount === 1 ? 'employee' : 'employees'}
        </Text>
      </View>
      <View style={styles.adminBlock}>
        <Text style={styles.adminLabel}>ADMIN</Text>
        {admin ? (
          <>
            <Text style={styles.adminName}>{admin.name}</Text>
            <Text style={styles.adminEmail} numberOfLines={1}>
              {admin.email}
            </Text>
          </>
        ) : (
          <Text style={styles.adminEmail}>No admin assigned</Text>
        )}
      </View>
      <View style={styles.actionRow}>
        <CandyButton title="Edit" variant="secondary" small pill onPress={onEdit} />
        <CandyButton title="Delete" variant="primary" small pill onPress={onDelete} />
      </View>
    </OutlinedCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  name: {
    fontFamily: theme.fonts.display,
    fontSize: 20,
    color: theme.colors.ink,
  },
  industry: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.ink,
    opacity: 0.7,
    marginTop: 2,
  },
  countPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 12,
    paddingVertical: 3,
    marginTop: 12,
  },
  countPillText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.muted,
  },
  adminBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51,47,58,0.08)',
  },
  adminLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 2,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  adminName: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    marginTop: 3,
  },
  adminEmail: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.ink,
    opacity: 0.6,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
});
