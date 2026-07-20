import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const ACCENTS = {
  coral: theme.colors.coral,
  teal: theme.colors.teal,
  violet: theme.colors.violet,
  mustard: theme.colors.mustard,
  sky: theme.colors.sky,
};

export default function ComingSoonCard({ icon, accent = 'coral', title, description, style }) {
  return (
    <View style={style}>
      <View style={styles.card} pointerEvents="none">
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming Soon</Text>
        </View>
        <View style={styles.content}>
          <View style={[styles.iconChip, { backgroundColor: ACCENTS[accent] }]}>
            {icon}
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: theme.radius.card,
    padding: 20,
    ...theme.clayShadow,
  },
  badge: {
    position: 'absolute',
    top: 18,
    right: 18,
    backgroundColor: theme.colors.inputFill,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 1,
  },
  badgeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.muted,
  },
  content: {
    opacity: 0.5,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 18,
    color: theme.colors.ink,
    marginTop: 14,
  },
  description: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
  },
});
