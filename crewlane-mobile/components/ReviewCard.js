import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import OutlinedCard from './OutlinedCard';
import CandyButton from './CandyButton';
import { theme } from '../theme';

const STATUS_COLORS = {
  pending_self: theme.colors.mustard,
  pending_manager: theme.colors.sky,
  completed: theme.colors.teal,
};

const STATUS_LABELS = {
  pending_self: 'Awaiting self-review',
  pending_manager: 'Awaiting manager review',
  completed: 'Completed',
};

function Stars({ rating }) {
  return (
    <Text style={styles.stars}>
      {'★'.repeat(rating)}
      <Text style={styles.starsEmpty}>{'★'.repeat(5 - rating)}</Text>
      <Text style={styles.starsCount}>  {rating}/5</Text>
    </Text>
  );
}

export default function ReviewCard({ title, review, showManagerForm = false, onSubmitManager, style }) {
  const [rating, setRating] = useState(3);
  const [comments, setComments] = useState('');

  return (
    <OutlinedCard style={style} contentStyle={styles.content}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[review.status] }]}>
          <Text style={styles.statusText}>{STATUS_LABELS[review.status]}</Text>
        </View>
      </View>

      {review.status === 'pending_self' ? (
        <Text style={styles.muted}>Self-review not submitted yet.</Text>
      ) : (
        <View style={styles.body}>
          <Text style={styles.sectionLabel}>SELF REVIEW</Text>
          <Stars rating={review.selfRating} />
          {review.selfComments ? (
            <Text style={styles.comments}>“{review.selfComments}”</Text>
          ) : null}

          {review.status === 'completed' && review.managerRating != null && (
            <>
              <Text style={[styles.sectionLabel, styles.sectionGap]}>MANAGER REVIEW</Text>
              <Stars rating={review.managerRating} />
              {review.managerComments ? (
                <Text style={styles.comments}>“{review.managerComments}”</Text>
              ) : null}
            </>
          )}

          {review.status === 'pending_manager' && showManagerForm && (
            <View style={styles.form}>
              <Text style={styles.label}>Your rating (1–5)</Text>
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setRating(n)}
                    style={[styles.ratingPill, rating === n && styles.ratingPillSelected]}
                  >
                    <Text
                      style={[styles.ratingText, rating === n && styles.ratingTextSelected]}
                    >
                      {n}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>Comments</Text>
              <TextInput
                style={styles.input}
                value={comments}
                onChangeText={setComments}
                placeholderTextColor={theme.colors.muted}
                multiline
                textAlignVertical="top"
              />
              <CandyButton
                title="Submit Manager Review"
                variant="primary"
                small
                pill
                onPress={() =>
                  onSubmitManager(review.id, { managerRating: rating, managerComments: comments })
                }
                style={styles.submit}
              />
            </View>
          )}
        </View>
      )}
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
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    color: theme.colors.white,
  },
  muted: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 10,
  },
  body: {
    marginTop: 12,
  },
  sectionLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: theme.colors.muted,
    marginBottom: 4,
  },
  sectionGap: {
    marginTop: 14,
  },
  stars: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.mustard,
  },
  starsEmpty: {
    color: theme.colors.inputFill,
  },
  starsCount: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.ink,
  },
  comments: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.ink,
    marginTop: 4,
  },
  form: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(51,47,58,0.08)',
  },
  label: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.ink,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  ratingPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPillSelected: {
    backgroundColor: theme.colors.violet,
    ...theme.clayShadowButton,
  },
  ratingText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.ink,
  },
  ratingTextSelected: {
    color: theme.colors.white,
  },
  input: {
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.inputFill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.ink,
    minHeight: 70,
    marginBottom: 12,
  },
  submit: {
    marginTop: 2,
  },
});
