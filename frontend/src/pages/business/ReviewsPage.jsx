import { useState, useEffect } from 'react';
import { reviewAPI, businessAPI } from '../../api';
import { Star, MessageCircle, ChevronDown, ChevronUp, Send } from 'lucide-react';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StarRating from '../../components/ui/StarRating';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function BusinessReviewsPage() {
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null); // review._id being replied to
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const bizRes = await businessAPI.getMy();
      setBusiness(bizRes.data.data);
      const rvRes = await reviewAPI.getByBusiness(bizRes.data.data._id, { limit: 50 });
      setReviews(rvRes.data.data || []);
    } catch {
      toast.error('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return toast.error('Reply cannot be empty.');
    setSubmittingReply(true);
    try {
      await reviewAPI.reply(reviewId, { reply: replyText });
      toast.success('Reply posted!');
      setReplyingTo(null);
      setReplyText('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const toggleReply = (id) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Summary stats
  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews.filter((rv) => rv.rating === r).length,
  }));

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="xl" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl font-bold mb-1">Customer Reviews</h1>
          <p className="text-indigo-200 text-sm">{business?.name} &bull; {reviews.length} reviews</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Rating Summary */}
        {reviews.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
              <div className="text-center">
                <p className="text-5xl font-bold text-gray-900 dark:text-white">{business?.avgRating?.toFixed(1) || '0.0'}</p>
                <StarRating rating={business?.avgRating || 0} size="md" className="justify-center mt-2" />
                <p className="text-sm text-gray-400 mt-1">{reviews.length} reviews</p>
              </div>
              <div className="flex-1 space-y-2 w-full">
                {ratingDistribution.map(({ rating, count }) => (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-4 text-right">{rating}</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 w-6">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700">
            <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No reviews yet</h3>
            <p className="text-gray-400">Reviews will appear here once customers complete appointments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm">
                {/* Reviewer info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {review.customer?.avatar ? (
                      <img src={review.customer.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center font-bold text-indigo-600">
                        {review.customer?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{review.customer?.name}</p>
                      <p className="text-xs text-gray-400">{format(new Date(review.createdAt), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>

                {/* Comment */}
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">{review.comment}</p>

                {/* Existing owner reply */}
                {review.ownerReply && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4 mb-3">
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> Your Reply
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{review.ownerReply}</p>
                  </div>
                )}

                {/* Reply actions */}
                {!review.ownerReply && (
                  <div>
                    {replyingTo === review._id ? (
                      <div className="mt-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          className="input-field resize-none text-sm mb-2"
                          placeholder="Write a professional response..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                            className="btn-secondary text-sm flex-1"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleReply(review._id)}
                            disabled={submittingReply}
                            className="btn-primary text-sm flex-1 flex items-center justify-center gap-1"
                          >
                            {submittingReply ? <LoadingSpinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
                            {submittingReply ? 'Posting...' : 'Post Reply'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(review._id)}
                        className="text-sm text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Reply to this review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
