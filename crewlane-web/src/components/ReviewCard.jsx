import { useState } from 'react';
import OutlinedCard from './OutlinedCard.jsx';
import CandyButton from './CandyButton.jsx';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-2.5 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

const STATUS_STYLES = {
  pending_self: 'bg-mustard text-white',
  pending_manager: 'bg-sky text-white',
  completed: 'bg-teal text-white',
};

const STATUS_LABELS = {
  pending_self: 'Awaiting self-review',
  pending_manager: 'Awaiting manager review',
  completed: 'Completed',
};

function Stars({ rating }) {
  return (
    <span className="text-mustard font-bold">
      {'★'.repeat(rating)}
      <span className="text-muted">{'★'.repeat(5 - rating)}</span>
      <span className="text-ink text-xs font-body font-bold ml-1.5">{rating}/5</span>
    </span>
  );
}

export default function ReviewCard({ title, review, showManagerForm = false, onSubmitManager }) {
  const [rating, setRating] = useState('3');
  const [comments, setComments] = useState('');

  return (
    <OutlinedCard className="p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display font-extrabold text-lg">{title}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[review.status]}`}
        >
          {STATUS_LABELS[review.status]}
        </span>
      </div>

      {review.status === 'pending_self' ? (
        <p className="text-sm text-muted mt-3">Self-review not submitted yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">
              Self Review
            </p>
            <p className="mt-1">
              <Stars rating={review.selfRating} />
            </p>
            {review.selfComments && (
              <p className="text-sm text-ink mt-1">“{review.selfComments}”</p>
            )}
          </div>

          {review.status === 'completed' && review.managerRating != null && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted">
                Manager Review
              </p>
              <p className="mt-1">
                <Stars rating={review.managerRating} />
              </p>
              {review.managerComments && (
                <p className="text-sm text-ink mt-1">“{review.managerComments}”</p>
              )}
            </div>
          )}

          {review.status === 'pending_manager' && showManagerForm && (
            <div className="pt-3 border-t-2 border-ink/5 space-y-3">
              <p className="font-bold text-sm">Your manager review</p>
              <div>
                <label className="block font-bold text-sm mb-1.5">Rating (1–5)</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className={INPUT_CLASS}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-sm mb-1.5">Comments</label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>
              <CandyButton
                variant="primary"
                small
                onClick={() => onSubmitManager(review.id, { managerRating: rating, managerComments: comments })}
              >
                Submit Manager Review
              </CandyButton>
            </div>
          )}
        </div>
      )}
    </OutlinedCard>
  );
}
