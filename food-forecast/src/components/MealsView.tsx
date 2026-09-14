import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  ShieldCheck,
  Eye,
  Trash2,
  Edit,
  Sparkles,
  Users,
  MessageSquare,
} from 'lucide-react';
import { Meal, MealType, MealStatus } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface MealsViewProps {
  onLogConsumption: (mealId: number) => void;
}

export const MealsView: React.FC<MealsViewProps> = ({ onLogConsumption }) => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newMealType, setNewMealType] = useState<MealType>('Lunch');
  const [newMenu, setNewMenu] = useState<string>('');
  const [newExpected, setNewExpected] = useState<number | ''>('');
  const [newCost, setNewCost] = useState<number | ''>('');
  const [previewPrediction, setPreviewPrediction] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Detail Modal State
  const [selectedMealDetail, setSelectedMealDetail] = useState<{
    meal: Meal;
    intentions: any[];
    feedback: any[];
  } | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const res = await api.getMeals({
        mealType: selectedMealType || undefined,
        status: selectedStatus || undefined,
      });
      setMeals(res.meals || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch meals:', err);
      setError(err.message || 'Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [selectedMealType, selectedStatus]);

  // Live prediction preview for creation modal
  useEffect(() => {
    if (!isCreateOpen) return;
    if (newExpected === '' || isNaN(Number(newExpected)) || Number(newExpected) <= 0) {
      setPreviewPrediction(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.calculatePrediction({
          mealType: newMealType,
          date: newDate,
          expectedAttendance: Number(newExpected),
        });
        setPreviewPrediction(res.prediction);
      } catch (err) {
        console.error('Preview error:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [newDate, newMealType, newExpected, isCreateOpen]);

  const handleCreateMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenu.trim() || newExpected === '' || newCost === '') return;

    try {
      setIsSubmitting(true);
      await api.createMeal({
        date: newDate,
        mealType: newMealType,
        menu: newMenu.trim(),
        expectedAttendance: Number(newExpected),
        costPerMeal: Number(newCost),
      });
      setIsCreateOpen(false);
      setNewMenu('');
      setNewExpected('');
      setNewCost('');
      fetchMeals();
    } catch (err: any) {
      alert('Error creating meal: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      setIsDetailLoading(true);
      const res = await api.getMealById(id);
      setSelectedMealDetail(res);
    } catch (err) {
      console.error('Failed to get meal details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDeleteMeal = async (id: number) => {
    if (!confirm('Are you sure you want to delete this meal record?')) return;
    try {
      await api.deleteMeal(id);
      fetchMeals();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filteredMeals = meals.filter((m) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        m.menu.toLowerCase().includes(q) ||
        m.meal_type.toLowerCase().includes(q) ||
        m.date.includes(q)
      );
    }
    return true;
  });

  return (
    <div id="meals-view" className="space-y-6 pb-16 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Meal Demand & Menu Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse planned menus, automated demand forecasts, dynamic buffer sizing, and student feedback.
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
          <button
            id="create-meal-btn"
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="btn-bubble-green flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,240,114,0.35)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Meal Forecast</span>
          </button>
        )}
      </div>

      {/* Filter Bar in Shiny Black */}
      <div className="card-shiny-black p-4 rounded-3xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="meal-search-input"
              type="text"
              placeholder="Search dishes or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-xs text-white focus:outline-hidden focus:border-[#10f072]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end">
          <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value)}
              className="bg-transparent border-none text-xs text-white font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="" className="bg-zinc-900">All Meal Types</option>
              <option value="Breakfast" className="bg-zinc-900">Breakfast</option>
              <option value="Lunch" className="bg-zinc-900">Lunch</option>
              <option value="Snacks" className="bg-zinc-900">Snacks</option>
              <option value="Dinner" className="bg-zinc-900">Dinner</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent border-none text-xs text-white font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="" className="bg-zinc-900">All Statuses</option>
              <option value="PLANNED" className="bg-zinc-900">Planned</option>
              <option value="SERVING" className="bg-zinc-900">Serving Now</option>
              <option value="COMPLETED" className="bg-zinc-900">Completed</option>
            </select>
          </div>

          {(selectedMealType || selectedStatus || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedMealType('');
                setSelectedStatus('');
                setSearchQuery('');
              }}
              className="text-xs text-[#10f072] font-black hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Meals Table in Shiny Black */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold">
          Loading meals from database...
        </div>
      ) : filteredMeals.length === 0 ? (
        <div className="card-shiny-black p-12 rounded-3xl border border-zinc-800 text-center text-slate-400 max-w-lg mx-auto">
          <Utensils className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="font-bold text-white text-sm">No meals match your criteria</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting your filters or create a new meal forecast.</p>
        </div>
      ) : (
        <div className="card-shiny-black rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Date & Meal</th>
                  <th className="px-4 py-3.5">Menu Dishes</th>
                  <th className="px-4 py-3.5 text-center">Predicted</th>
                  <th className="px-4 py-3.5 text-center">Buffer</th>
                  <th className="px-4 py-3.5 text-center">Target Prep</th>
                  <th className="px-4 py-3.5 text-center">Actual Turnout</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredMeals.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-white">{m.date}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-300">{m.meal_type}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-slate-300 font-bold border border-zinc-700">
                          {m.status}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="text-slate-200 font-medium line-clamp-2" title={m.menu}>
                        {m.menu}
                      </div>
                      {m.confirmed_students !== undefined && m.confirmed_students > 0 && (
                        <div className="text-[10px] text-[#10f072] font-bold mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {m.confirmed_students} students confirmed attendance
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap font-bold text-slate-200">
                      {m.predicted_demand || '-'}
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {m.buffer_amount ? (
                        <span className="font-bold text-[#10f072] bg-[#10f072]/15 border border-[#10f072]/30 px-2.5 py-0.5 rounded-full text-[11px]">
                          +{m.buffer_amount} ({m.recommended_buffer_percent}%)
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap font-black text-white text-sm">
                      {m.recommended_preparation || '-'}
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap font-black">
                      {m.actual_consumption ? (
                        <span className="text-sky-400">{m.actual_consumption}</span>
                      ) : (
                        <span className="text-slate-500 font-normal italic">Pending</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {m.consumption_status ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            m.consumption_status === 'SHORTAGE_RISK'
                              ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                              : m.consumption_status === 'BUFFER_USED'
                              ? 'bg-sky-950/70 border-sky-500/50 text-sky-300'
                              : m.consumption_status === 'SURPLUS_RISK'
                              ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                              : 'bg-emerald-950/70 border-emerald-500/50 text-[#10f072]'
                          }`}
                        >
                          {m.consumption_status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewDetails(m.id)}
                          className="p-1.5 rounded-lg border border-zinc-700 hover:bg-zinc-800 text-slate-300 transition-colors"
                          title="View Details & Feedback"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                          <button
                            type="button"
                            onClick={() => onLogConsumption(m.id)}
                            className="btn-bubble-green px-2.5 py-1 rounded-full text-[11px] font-black transition-all"
                          >
                            Log Turnout
                          </button>
                        )}

                        {user?.role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMeal(m.id)}
                            className="p-1.5 rounded-lg border border-rose-800/80 text-rose-400 hover:bg-rose-950/60 transition-colors"
                            title="Delete Meal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Meal Modal in Shiny Black */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-shiny-black rounded-3xl max-w-xl w-full border border-zinc-700 shadow-2xl p-6 sm:p-7 relative animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-black text-white mb-1 flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-black border border-[#10f072]/40 text-[#10f072]">
                <Utensils className="w-4 h-4" />
              </span>
              Schedule Meal & Compute Buffer
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Enter meal specifications. The algorithm calculates expected demand and dynamic safety cushion automatically.
            </p>

            <form onSubmit={handleCreateMeal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-bold focus:outline-hidden focus:border-[#10f072]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Meal Type</label>
                  <select
                    value={newMealType}
                    onChange={(e) => setNewMealType(e.target.value as MealType)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-bold focus:outline-hidden focus:border-[#10f072]"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Menu Items</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter menu items (e.g. Rajma Chawal, Roti, Salad, Gulab Jamun)..."
                  value={newMenu}
                  onChange={(e) => setNewMenu(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white focus:outline-hidden focus:border-[#10f072]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Expected Capacity / Base Attendance</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Enter expected headcount (e.g. 400)..."
                    value={newExpected}
                    onChange={(e) => setNewExpected(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-black text-sm focus:outline-hidden focus:border-[#10f072]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Cost Per Meal (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Enter cost per meal in ₹ (e.g. 45)..."
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-black text-sm focus:outline-hidden focus:border-[#10f072]"
                  />
                </div>
              </div>

              {/* Dynamic Buffer Preview Card */}
              {previewPrediction && (
                <div className="bg-black/60 border border-emerald-500/40 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5 text-[#10f072]">
                      <Sparkles className="w-3.5 h-3.5" />
                      Algorithmic Forecast Preview
                    </span>
                    <span className="bg-zinc-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
                      Confidence: {(previewPrediction.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Predicted</div>
                      <div className="text-base font-black text-white">{previewPrediction.predictedDemand}</div>
                    </div>
                    <div className="bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-500/30">
                      <div className="text-[10px] text-[#10f072] uppercase font-semibold">Buffer</div>
                      <div className="text-base font-black text-[#10f072]">+{previewPrediction.bufferAmount} ({previewPrediction.recommendedBuffer}%)</div>
                    </div>
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-white uppercase font-semibold">Total Prep</div>
                      <div className="text-base font-black text-white">{previewPrediction.recommendedPreparation}</div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 leading-snug pt-1">
                    {previewPrediction.reasoning}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-full border border-zinc-700 text-slate-300 hover:bg-zinc-800 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-bubble-green px-5 py-2 rounded-full text-xs font-black transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm & Schedule Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meal Detail Modal in Shiny Black */}
      {selectedMealDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card-shiny-black rounded-3xl max-w-2xl w-full border border-zinc-700 shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-xs font-black text-[#10f072] uppercase tracking-wide">
                  {selectedMealDetail.meal.date} • {selectedMealDetail.meal.meal_type}
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {selectedMealDetail.meal.menu}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMealDetail(null)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                <div className="text-[10px] text-slate-400 font-semibold">PREDICTED</div>
                <div className="text-xl font-black text-white">{selectedMealDetail.meal.predicted_demand || '-'}</div>
              </div>
              <div className="p-3.5 bg-emerald-950/40 rounded-2xl border border-emerald-500/30">
                <div className="text-[10px] text-[#10f072] font-semibold">BUFFER</div>
                <div className="text-xl font-black text-[#10f072]">+{selectedMealDetail.meal.buffer_amount} ({selectedMealDetail.meal.recommended_buffer_percent}%)</div>
              </div>
              <div className="p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                <div className="text-[10px] text-white font-semibold">RECOMMENDED PREP</div>
                <div className="text-xl font-black text-white">{selectedMealDetail.meal.recommended_preparation || '-'}</div>
              </div>
              <div className="p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800">
                <div className="text-[10px] text-slate-400 font-semibold">ACTUAL CONSUMED</div>
                <div className="text-xl font-black text-sky-400">{selectedMealDetail.meal.actual_consumption || '-'}</div>
              </div>
            </div>

            {/* Student Intentions / RSVPs */}
            <div className="mt-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#10f072]" />
                Student Attendance Intentions ({selectedMealDetail.intentions.length})
              </h3>
              {selectedMealDetail.intentions.length === 0 ? (
                <div className="text-xs text-slate-400 italic bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800">
                  No individual RSVPs recorded for this slot yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {selectedMealDetail.intentions.map((intent: any) => (
                    <div key={intent.id} className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-xs flex items-center justify-between">
                      <span className="font-semibold text-white">{intent.student_name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        intent.attending ? 'bg-[#10f072]/15 text-[#10f072] border border-[#10f072]/30' : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {intent.attending ? 'Attending' : 'Skipping'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Student Feedback */}
            <div className="mt-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#10f072]" />
                Student Reviews & Waste Feedback ({selectedMealDetail.feedback.length})
              </h3>
              {selectedMealDetail.feedback.length === 0 ? (
                <div className="text-xs text-slate-400 italic bg-zinc-900 p-3.5 rounded-2xl border border-zinc-800">
                  No student feedback submitted for this meal yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedMealDetail.feedback.map((f: any) => (
                    <div key={f.id} className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{f.student_name}</span>
                        <span className="text-amber-400 font-bold">★ {f.rating}/5</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{f.comments}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMealDetail(null)}
                className="btn-bubble-green px-5 py-2 rounded-full text-xs font-black"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
