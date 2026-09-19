import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, MessageSquarePlus } from 'lucide-react';
import type { Review } from '../../types';
import { apiService } from '../../services/api';

export const ProductReviews: React.FC<{ productId: string; averageRating: number; reviewCount: number }> = ({
  productId,
  averageRating = 0,
  reviewCount: _reviewCount = 0
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    setLoading(true);
    const data = await apiService.getReviews(productId);
    setReviews(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) return;

    setIsSubmitting(true);
    await apiService.addReview(productId, {
      productId,
      userName: name,
      rating,
      comment,
      verifiedPurchase: true
    });
    setName('');
    setComment('');
    setShowForm(false);
    setIsSubmitting(false);
    loadReviews();
  };

  return (
    <section className="pt-6 sm:pt-8 border-t border-slate-200">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600 block mb-0.5">
            Verified Feedback
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
            Customer Craft Reviews
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real experiences from owners of our handcrafted Peshawari footwear
          </p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 self-stretch sm:self-auto justify-between sm:justify-start">
          <div className="text-left sm:text-center">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 block leading-tight">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-0.5 my-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${star <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-400">{reviews.length} verified reviews</span>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-copper text-xs sm:text-sm py-2 sm:py-2.5 px-4 sm:px-5 flex items-center gap-1.5 shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Write Review
          </button>
        </div>
      </div>

      {/* Review Form Drawer */}
      {showForm && (
        <form onSubmit={handleSubmit} className="my-6 p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900">Share Your Experience</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Bilal Afridi"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1 font-medium">Rating</label>
              <div className="flex gap-1.5 items-center h-9">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-600 mb-1 font-medium">Your Review Comment</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Describe leather quality, fitting, sole comfort, and craftsmanship..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-copper text-xs py-2 px-5"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="mt-6 space-y-3 sm:space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs sm:text-sm bg-slate-50 rounded-2xl border border-slate-200/80">
            No reviews yet. Be the first verified customer to leave feedback!
          </div>
        ) : (
          reviews.map(rev => (
            <div key={rev.id} className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-start justify-between gap-3">
                {/* Reviewer Name & Info */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-serif font-bold text-xs sm:text-sm shrink-0">
                    {rev.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {rev.userName}
                    </h4>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 block">{rev.date}</span>
                  </div>
                </div>

                {/* Right Top: Verified Badge & Star Rating */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    {rev.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold shrink-0">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    )}
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-10 sm:pl-12">
                "{rev.comment}"
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
