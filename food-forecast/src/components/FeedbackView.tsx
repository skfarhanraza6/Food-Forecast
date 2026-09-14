import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  Star,
  CheckCircle2,
  Utensils,
  Sparkles,
  HeartHandshake,
  Send,
} from 'lucide-react';
import { FeedbackItem, Meal } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export const FeedbackView: React.FC = () => {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form state
  const [selectedMealId, setSelectedMealId] = useState<number | ''>('');
  const [rating, setRating] = useState<number>(5);
  const [tasteRating, setTasteRating] = useState<number>(5);
  const [portionRating, setPortionRating] = useState<number>(4);
  const [comments, setComments] = useState<string>('');
  const [wouldEatAgain, setWouldEatAgain] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fRes, mRes] = await Promise.all([api.getFeedback(), api.getMeals()]);
      setFeedbackList(fRes.feedback || []);
      setMeals(mRes.meals || []);
      if (mRes.meals && mRes.meals.length > 0 && !selectedMealId) {
        setSelectedMealId(mRes.meals[0].id);
      }
    } catch (err) {
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMealId || !comments.trim()) return;

    try {
      setIsSubmitting(true);
      await api.submitFeedback({
        mealId: Number(selectedMealId),
        rating,
        tasteRating,
        portionRating,
        comments,
        wouldEatAgain,
      });
      setComments('');
      setSuccessMessage('Thank you! Your feedback will help improve demand predictions and reduce kitchen scrap.');
      setTimeout(() => setSuccessMessage(null), 4000);
      loadData();
    } catch (err: any) {
      alert('Error submitting feedback: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="feedback-view" className="space-y-6 pb-16 max-w-5xl mx-auto text-slate-100">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Student Food & Portion Feedback Loop
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Direct student feedback trains the prediction engine to detect unpopular recipes and avoid oversized portions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Submit Form in Shiny Black */}
        <div className="lg:col-span-5 card-shiny-black p-6 rounded-3xl border border-zinc-800 shadow-2xl text-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <span className="p-1.5 rounded-xl bg-black border border-[#10f072]/40 text-[#10f072]">
              <Utensils className="w-4 h-4" />
            </span>
            <h2 className="font-bold text-white text-sm">Submit Meal Review</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Select Meal</label>
              <select
                required
                value={selectedMealId}
                onChange={(e) => setSelectedMealId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-bold focus:outline-hidden focus:border-[#10f072]"
              >
                {meals.map((m) => (
                  <option key={m.id} value={m.id} className="bg-zinc-900">
                    {m.date} • {m.meal_type} — {m.menu.substring(0, 35)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Star Ratings */}
            <div className="space-y-3 bg-black/60 p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Overall Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`text-lg transition-transform hover:scale-110 ${s <= rating ? 'text-amber-400' : 'text-zinc-700'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Taste & Flavor:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTasteRating(s)}
                      className={`text-lg transition-transform hover:scale-110 ${s <= tasteRating ? 'text-amber-400' : 'text-zinc-700'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Portion Size Calibration:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPortionRating(s)}
                      className={`text-lg transition-transform hover:scale-110 ${s <= portionRating ? 'text-amber-400' : 'text-zinc-700'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Comments & Observations on Leftovers
              </label>
              <textarea
                rows={3}
                required
                placeholder="Enter comments on food taste, quality, or portion sizing..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white focus:outline-hidden focus:border-[#10f072]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="would-eat-checkbox"
                type="checkbox"
                checked={wouldEatAgain}
                onChange={(e) => setWouldEatAgain(e.target.checked)}
                className="rounded-sm accent-[#10f072] cursor-pointer"
              />
              <label htmlFor="would-eat-checkbox" className="font-bold text-slate-300 cursor-pointer">
                Would like this menu item served again
              </label>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-950/70 border border-emerald-500/50 text-[#10f072] rounded-2xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10f072] shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              id="submit-feedback-btn"
              type="submit"
              disabled={isSubmitting}
              className="btn-bubble-green w-full py-2.5 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,240,114,0.35)] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>{isSubmitting ? 'Submitting...' : 'Post Review'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Feedback Feed in Shiny Black */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between pb-2">
            <h2 className="font-bold text-white text-sm">
              Recent Campus Dining Reviews ({feedbackList.length})
            </h2>
            <span className="text-xs text-slate-400">Authentic student input</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading reviews...</div>
          ) : feedbackList.length === 0 ? (
            <div className="card-shiny-black p-8 rounded-3xl border border-zinc-800 text-center text-xs text-slate-400">
              No reviews submitted yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {feedbackList.map((fb) => (
                <div key={fb.id} className="card-shiny-black p-4 sm:p-5 rounded-3xl border border-zinc-800 shadow-xl text-xs space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white text-sm">{fb.student_name || 'Student'}</span>
                      <div className="text-[11px] text-slate-400">
                        {fb.date} • {fb.meal_type}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                      <span className="font-bold text-amber-400">★ {fb.rating}</span>
                      <span className="text-[10px] text-amber-300">/5</span>
                    </div>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed bg-black/60 p-3.5 rounded-2xl border border-zinc-800">
                    "{fb.comments}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-3">
                      <span>Taste: <strong className="text-white">{fb.taste_rating}/5</strong></span>
                      <span>Portion: <strong className="text-white">{fb.portion_rating}/5</strong></span>
                    </span>
                    {fb.would_eat_again ? (
                      <span className="text-[#10f072] font-bold">✓ Wants repeat</span>
                    ) : (
                      <span className="text-rose-400 font-bold">✕ Request menu change</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
