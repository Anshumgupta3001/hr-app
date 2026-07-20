import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import OutlinedCard from './OutlinedCard';
import { theme } from '../theme';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export default function GoalRow({ goal, editable = false, onUpdate, style }) {
  return (
    <OutlinedCard style={style} contentStyle={styles.content}>
      {editable ? (
        <TextInput
          style={[styles.input, styles.titleInput]}
          defaultValue={goal.title}
          onEndEditing={(e) => onUpdate(goal.id, { title: e.nativeEvent.text })}
          placeholderTextColor={theme.colors.muted}
        />
      ) : (
        <Text style={styles.title}>{goal.title}</Text>
      )}
      {editable ? (
        <TextInput
          style={[styles.input, styles.descInput]}
          defaultValue={goal.description}
          onEndEditing={(e) => onUpdate(goal.id, { description: e.nativeEvent.text })}
          placeholder="Goal description"
          placeholderTextColor={theme.colors.muted}
          multiline
          textAlignVertical="top"
        />
      ) : (
        goal.description ? <Text style={styles.description}>{goal.description}</Text> : null
      )}
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((option) => {
          const selected = goal.status === option.value;
          return (
            <Pressable
              key={option.value}
              disabled={!editable}
              onPress={() => onUpdate(goal.id, { status: option.value })}
              style={[styles.statusPill, selected && styles.statusPillSelected]}
            >
              <Text style={[styles.statusText, selected && styles.statusTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </OutlinedCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 18,
  },
  title: {
    fontFamily: theme.fonts.displayBold,
    fontSize: 16,
    color: theme.colors.ink,
  },
  description: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 6,
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.ink,
  },
  titleInput: {
    fontFamily: theme.fonts.bodyBold,
  },
  descInput: {
    marginTop: 10,
    minHeight: 60,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusPillSelected: {
    backgroundColor: theme.colors.violet,
    ...theme.clayShadowButton,
  },
  statusText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.muted,
  },
  statusTextSelected: {
    color: theme.colors.white,
  },
});
