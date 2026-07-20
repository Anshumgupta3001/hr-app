import { View, StyleSheet } from 'react-native';
import { theme } from '../theme';

export default function OutlinedCard({ children, style, contentStyle }) {
  return (
    <View style={style}>
      <View style={[styles.card, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: theme.radius.card,
    padding: 24,
    ...theme.clayShadow,
  },
});
