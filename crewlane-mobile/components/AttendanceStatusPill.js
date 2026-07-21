import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const STATUS_COLORS = {
  present: theme.colors.teal,
  early_leave: theme.colors.mustard,
  incomplete: theme.colors.sky,
  absent: theme.colors.coral,
};

const STATUS_LABELS = {
  present: 'PRESENT',
  early_leave: 'EARLY LEAVE',
  incomplete: 'INCOMPLETE',
  absent: 'ABSENT',
};

export default function AttendanceStatusPill({ status }) {
  return (
    <View style={[styles.pill, { backgroundColor: STATUS_COLORS[status] || theme.colors.white }]}>
      <Text style={styles.text}>{STATUS_LABELS[status] || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    ...theme.clayShadowButton,
  },
  text: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
  },
});
