import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';

export default function ChecklistItem({ task, onToggle }) {
  return (
    <Pressable onPress={() => onToggle(task.id)} style={styles.row}>
      <View style={[styles.checkbox, task.isCompleted && styles.checkboxDone]}>
        {task.isCompleted && (
          <Svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.white}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M4 12.5l5.5 5.5L20 6.5" />
          </Svg>
        )}
      </View>
      <Text style={[styles.title, task.isCompleted && styles.titleDone]}>{task.title}</Text>
      {task.isCompleted && task.completedAt ? (
        <Text style={styles.date}>{new Date(task.completedAt).toLocaleDateString()}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: theme.radius.chip,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...theme.clayShadow,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.inputFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: theme.colors.teal,
    ...theme.clayShadowButton,
  },
  title: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    flex: 1,
  },
  titleDone: {
    color: theme.colors.muted,
    textDecorationLine: 'line-through',
  },
  date: {
    fontFamily: theme.fonts.body,
    fontSize: 10,
    color: theme.colors.muted,
  },
});
