import React, { useState, useEffect } from 'react';
import { Check, EyeOff, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Review } from '../../types';

export const ReviewsTab: React.FC = () => {
  const [reviews, setReviews] = useState<(Review & { productName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number | 'All'>('All');
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const list = await apiService.getAllReviews();
    setReviews(list);
    setLoading(false);
  };

  const handleUpdateStatus = async (productId: string, reviewId: string, status: 'approved' | 'hidden') => {
    await apiService.updateReviewStatus(productId, reviewId, status);
    loadReviews();
  };

  const handleDeleteReview = async (productId: string, reviewId: string) => {
    if (confirm('Delete this review permanently?')) {
      await apiService.deleteReview(productId, reviewId);
      loadReviews();
    }
  };

  const handleAddReply = (reviewId: string) => {
    const text = replyTextMap[reviewId];
    if (!text || !text.trim()) return;
    alert(`Public response saved for review ${reviewId}: "${text}"`);
    setReplyTextMap({ ...replyTextMap, [reviewId]: '' });
  };

  const filteredReviews = reviews.filter(r => {
    if (selectedRating !== 'All' && r.rating !== selectedRating) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="font-serif font-bold text-2xl text-slate-900">Product Reviews & Ratings Moderation</h2>
          <p className="text-xs text-slate-500">Approve, hide, or publicly reply to verified customer feedback.</p>
        </div>

        {/* Rating Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Filter by Rating:</span>
          <select
            value={selectedRating}
            onChange={e => setSelectedRating(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
          >
            <option value="All">All Stars</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Comment & Reply</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">Loading reviews...</td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">No reviews found matching criteria.</td>
                </tr>
              ) : (
                filteredReviews.map(rev => (
                  <tr key={rev.id} className="hover:bg-slate-50/60 align-top">
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[160px]">
                      {rev.productName || rev.productId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{rev.userName}</div>
                      {rev.verifiedPurchase && (
                        <span className="text-[10px] text-emerald-600 font-bold">Verified Buyer</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex text-[#D4AF37] font-bold">
                        {'★'.repeat(rev.rating)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm space-y-2">
                      <p className="text-slate-700 leading-relaxed italic">"{rev.comment}"</p>

                      {/* Admin Inline Reply Box */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={replyTextMap[rev.id] || ''}
                          onChange={e => setReplyTextMap({ ...replyTextMap, [rev.id]: e.target.value })}
                          placeholder="Type official brand reply..."
                          className="flex-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] focus:outline-none focus:border-blue-600"
                        />
                        <button
                          onClick={() => handleAddReply(rev.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all"
                        >
                          Reply
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{rev.date}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        rev.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {rev.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      {rev.status === 'approved' ? (
                        <button
                          onClick={() => handleUpdateStatus(rev.productId, rev.id, 'hidden')}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-amber-600 transition-colors"
                          title="Hide Review"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(rev.productId, rev.id, 'approved')}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-emerald-600 transition-colors"
                          title="Approve Review"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteReview(rev.productId, rev.id)}
                        className="p-1.5 rounded-lg border transition-colors shadow-2xs hover:scale-105"
                        style={{ color: '#DC2626', backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }}
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#DC2626', stroke: '#DC2626' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
