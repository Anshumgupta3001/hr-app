import { View, Text, StyleSheet } from 'react-native';
import OutlinedCard from './OutlinedCard';
import { timeAgo } from './PraiseCard';
import { theme } from '../theme';

export default function AnnouncementCard({ announcement, posterName, style }) {
  return (
    <OutlinedCard style={style} contentStyle={styles.content}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{announcement.title}</Text>
        <Text style={styles.time}>{timeAgo(announcement.createdAt)}</Text>
      </View>
      <Text style={styles.message}>{announcement.message}</Text>
      <Text style={styles.poster}>Posted by {posterName}</Text>
    </OutlinedCard>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontFamily: theme.fonts.display,
    fontSize: 17,
    color: theme.colors.ink,
    flexShrink: 1,
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
    lineHeight: 20,
  },
  poster: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.muted,
    marginTop: 10,
  },
});
