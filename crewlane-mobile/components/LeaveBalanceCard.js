import { View, Text, StyleSheet } from 'react-native';
import OutlinedCard from './OutlinedCard';
import { theme } from '../theme';

export default function LeaveBalanceCard({ balance, style }) {
  return (
    <OutlinedCard style={style} contentStyle={styles.content}>
      <View style={styles.topRow}>
        <Text style={styles.name}>{balance.name}</Text>
        <Text style={styles.fraction}>
          {balance.usedDays} / {balance.annualQuota}
        </Text>
      </View>
      <Text style={styles.remaining}>{balance.remaining}</Text>
      <Text style={styles.caption}>days remaining</Text>
    </OutlinedCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
    flexShrink: 1,
  },
  fraction: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.ink,
    opacity: 0.6,
  },
  remaining: {
    fontFamily: theme.fonts.display,
    fontSize: 30,
    color: theme.colors.ink,
    marginTop: 8,
  },
  caption: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.ink,
    opacity: 0.6,
  },
});
