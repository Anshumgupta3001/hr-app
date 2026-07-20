import { View, Text, StyleSheet } from 'react-native';
import OutlinedCard from './OutlinedCard';
import Avatar from './Avatar';
import { theme } from '../theme';

export function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function PraiseCard({ praise, fromName, toName, style }) {
  return (
    <OutlinedCard style={style} contentStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={styles.namesRow}>
          <Avatar employeeId={praise.fromEmployeeId} name={fromName} size={30} />
          <Text style={styles.names} numberOfLines={1}>
            {fromName} <Text style={styles.arrow}>→</Text> {toName}
          </Text>
        </View>
        <Text style={styles.time}>{timeAgo(praise.createdAt)}</Text>
      </View>
      <Text style={styles.message}>“{praise.message}”</Text>
    </OutlinedCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  namesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  names: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 15,
    color: theme.colors.ink,
    flexShrink: 1,
  },
  arrow: {
    color: theme.colors.violet,
  },
  time: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.muted,
  },
  message: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.ink,
    marginTop: 8,
  },
});
