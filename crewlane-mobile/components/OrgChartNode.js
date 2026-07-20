import { View, Text, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import { theme } from '../theme';

const ROLE_COLORS = {
  admin: { backgroundColor: theme.colors.violet, color: theme.colors.white },
  hr: { backgroundColor: theme.colors.sky, color: theme.colors.white },
  manager: { backgroundColor: theme.colors.coral, color: theme.colors.white },
  employee: { backgroundColor: theme.colors.teal, color: theme.colors.white },
};

const AVATAR_ACCENTS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981'];

export default function OrgChartNode({ employee, childrenByManager, depth = 0 }) {
  const reports = childrenByManager[employee.id] || [];
  const roleStyle = ROLE_COLORS[employee.role] || {
    backgroundColor: theme.colors.white,
    color: theme.colors.ink,
  };

  return (
    <View style={depth > 0 ? styles.nested : null}>
      <View style={styles.row}>
        <Avatar
          employeeId={employee.id}
          name={employee.name}
          size={34}
          accentColor={AVATAR_ACCENTS[depth % AVATAR_ACCENTS.length]}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {employee.name}
          </Text>
          <Text style={styles.designation} numberOfLines={1}>
            {employee.designation || '—'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: roleStyle.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: roleStyle.color }]}>
            {employee.role.toUpperCase()}
          </Text>
        </View>
      </View>
      {reports.map((report) => (
        <OrgChartNode
          key={report.id}
          employee={report}
          childrenByManager={childrenByManager}
          depth={depth + 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  nested: {
    marginLeft: 18,
    paddingLeft: 14,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(51,47,58,0.1)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: theme.radius.chip,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    ...theme.clayShadow,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.fonts.display,
    fontSize: 14,
    color: theme.colors.white,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 14,
    color: theme.colors.ink,
  },
  designation: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.muted,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 9,
  },
});
