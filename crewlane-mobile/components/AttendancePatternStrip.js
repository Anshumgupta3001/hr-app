import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const DOT_COLORS = {
  present: theme.colors.teal,
  early_leave: theme.colors.mustard,
  incomplete: theme.colors.sky,
  absent: theme.colors.coral,
  upcoming: theme.colors.inputFill,
};

const LEGEND = [
  { status: 'present', label: 'Present' },
  { status: 'early_leave', label: 'Early leave' },
  { status: 'incomplete', label: 'Incomplete' },
  { status: 'absent', label: 'Absent' },
];

export default function AttendancePatternStrip({ pattern = [] }) {
  return (
    <View>
      <View style={styles.grid}>
        {pattern.map((day) => (
          <View
            key={day.date}
            style={[styles.dot, { backgroundColor: DOT_COLORS[day.status] || theme.colors.inputFill }]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {LEGEND.map((item) => (
          <View key={item.status} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: DOT_COLORS[item.status] }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.muted,
  },
});
