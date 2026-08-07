import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, MessageSquarePlus } from 'lucide-react';
import type { Review } from '../../types';
import { apiService } from '../../services/api';

export const ProductReviews: React.FC<{ productId: string; averageRating: number; reviewCount: number }> = ({
  productId,
  averageRating,
  reviewCount: _reviewCount
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
    <section className="mt-16 glass-panel p-6 sm:p-8">
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-glass-border">
        <div>
          <h2 className="font-serif text-2xl font-bold text-text-primary">
            Customer Craft Reviews
          </h2>
          <p className="text-sm text-text-muted mt-1">
            Real feedback from owners of our handcrafted Peshawari Chappals
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <span className="font-serif text-3xl font-bold gradient-gold block">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex justify-center my-0.5">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(averageRating) ? 'fill-brass text-brass' : 'text-text-muted/30'}`}
                />
              ))}
            </div>
            <span className="text-xs text-text-muted">{reviews.length} verified reviews</span>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-copper text-sm py-2.5 px-5 flex items-center gap-2"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Write a Review
          </button>
        </div>
      </div>

      {/* Review Form Modal/Drawer */}
      {showForm && (
        <form onSubmit={handleSubmit} className="my-6 p-6 rounded-2xl bg-espresso-900/80 border border-copper/40 space-y-4">
          <h3 className="font-serif font-bold text-lg text-text-primary">Share Your Experience</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-muted mb-1 font-medium">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Bilal Afridi"
                className="w-full px-4 py-2.5 rounded-xl bg-espresso-800 border border-glass-border text-text-primary text-sm focus:outline-none focus:border-copper"
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1 font-medium">Rating</label>
              <div className="flex gap-2 items-center h-10">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-brass hover:scale-125 transition-transform"
                  >
                    <Star className={`w-6 h-6 ${star <= rating ? 'fill-brass' : 'text-text-muted/40'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-1 font-medium">Your Review Comment</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Describe leather quality, fitting, sole comfort, and craftsmanship..."
              className="w-full px-4 py-2.5 rounded-xl bg-espresso-800 border border-glass-border text-text-primary text-sm focus:outline-none focus:border-copper"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-glass text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-copper text-xs py-2 px-6"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-text-muted text-sm">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            No reviews yet. Be the first verified customer to leave feedback!
          </div>
        ) : (
          reviews.map(rev => (
            <div key={rev.id} className="p-5 rounded-2xl bg-glass-surface border border-glass-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-copper/20 text-copper border border-copper/30 flex items-center justify-center font-serif font-bold text-xs">
                    {rev.userName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                      {rev.userName}
                      {rev.verifiedPurchase && (
                        <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full flex items-center gap-1 font-normal">
                          <CheckCircle className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-text-muted">{rev.date}</span>
                  </div>
                </div>

                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= rev.rating ? 'fill-brass text-brass' : 'text-text-muted/30'}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-sm text-text-muted leading-relaxed pl-11">
                "{rev.comment}"
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
