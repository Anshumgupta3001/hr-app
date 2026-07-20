import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const STATUS_COLORS = {
  pending: theme.colors.mustard,
  approved: theme.colors.teal,
  denied: theme.colors.coral,
};

export default function LeaveStatusPill({ status }) {
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: STATUS_COLORS[status] || theme.colors.white },
      ]}
    >
      <Text style={styles.text}>{status.toUpperCase()}</Text>
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
