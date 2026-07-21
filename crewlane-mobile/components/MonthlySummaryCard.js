import { View, Text, StyleSheet } from 'react-native';
import OutlinedCard from './OutlinedCard';
import { theme } from '../theme';

function Stat({ label, value }) {
  return (
    <OutlinedCard style={styles.stat} contentStyle={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </OutlinedCard>
  );
}

export default function MonthlySummaryCard({ summary }) {
  if (!summary) return null;
  return (
    <View style={styles.grid}>
      <Stat label="Working Days" value={summary.workingDays} />
      <Stat label="Present" value={summary.presentDays} />
      <Stat label="Early Leave" value={summary.earlyLeaveDays} />
      <Stat label="Incomplete" value={summary.incompleteDays} />
      <Stat label="Absent" value={summary.absentDays} />
      <Stat label="Hours Worked" value={summary.totalHoursWorked} />
      <Stat label="Leave Days" value={summary.leaveDays} />
      <Stat label="Attendance %" value={`${summary.attendancePercentage}%`} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  statContent: {
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: theme.fonts.displayBlack,
    fontSize: 22,
    color: theme.colors.ink,
  },
  statLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    marginTop: 4,
    textAlign: 'center',
  },
});
