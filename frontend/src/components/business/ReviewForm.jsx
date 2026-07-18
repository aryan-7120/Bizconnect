import { useState } from 'react';
import { reviewAPI } from '../../api';
import StarRating from '../ui/StarRating';
import toast from 'react-hot-toast';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ReviewForm({ businessId, appointmentId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    if (!comment.trim()) { toast.error('Please write a review'); return; }
    setLoading(true);
    try {
      const { data } = await reviewAPI.create({ businessId, appointmentId, rating, comment });
      toast.success('Review submitted successfully!');
      onSuccess?.(data.data);
      setRating(0);
      setComment('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Leave a Review</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Review</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          className="input-field resize-none"
          maxLength={1000}
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{comment.length}/1000</p>
      </div>
      <button
        type="submit"
        disabled={loading || rating === 0}
        className="btn-primary w-full flex items-center justify-center gap-2"
        id="submit-review-btn"
      >
        {loading && <LoadingSpinner size="sm" />}
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}

export function ReviewCard({ review }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700">
      <div className="flex items-start gap-3 mb-3">
        {review.customer?.avatar ? (
          <img src={review.customer.avatar} alt={review.customer.name} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold text-sm">{review.customer?.name?.[0]?.toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{review.customer?.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{date}</p>
          </div>
          <StarRating rating={review.rating} size="xs" />
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{review.comment}</p>
      {review.ownerReply && (
        <div className="mt-3 pl-4 border-l-2 border-indigo-300 dark:border-indigo-600">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1">Business Response:</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{review.ownerReply}</p>
        </div>
      )}
    </div>
  );
}
