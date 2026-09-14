import React, { useState, useEffect } from 'react';
import {
  Scale,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  IndianRupee,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Meal, ConsumptionStatus } from '../types';
import { api } from '../api';

interface ConsumptionViewProps {
  initialMealId?: number | null;
  onSuccess?: () => void;
}

export const ConsumptionView: React.FC<ConsumptionViewProps> = ({ initialMealId, onSuccess }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<number | ''>(initialMealId || '');
  
  // Direct user inputs - started empty so user inputs their own real values
  const [actualPrep, setActualPrep] = useState<number | ''>('');
  const [actualCons, setActualCons] = useState<number | ''>('');
  const [leftoverKg, setLeftoverKg] = useState<number | ''>('');
  const [wasteReason, setWasteReason] = useState<string>('');
  const [actionTaken, setActionTaken] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [resultImpact, setResultImpact] = useState<any>(null);

  useEffect(() => {
    async function loadMeals() {
      try {
        const res = await api.getMeals();
        setMeals(res.meals || []);
        if (!selectedMealId && res.meals && res.meals.length > 0) {
          const current = res.meals.find((m) => m.status === 'SERVING') || res.meals[0];
          setSelectedMealId(current.id);
        }
      } catch (err) {
        console.error('Error loading meals for consumption:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMeals();
  }, [initialMealId]);

  const selectedMeal = meals.find((m) => m.id === Number(selectedMealId));

  // Dynamic preview calculations based on user's entered numbers
  const prepNum = actualPrep === '' ? 0 : Number(actualPrep);
  const consNum = actualCons === '' ? 0 : Number(actualCons);
  const currentSurplus = Math.max(0, prepNum - consNum);
  const currentShortage = Math.max(0, consNum - prepNum);
  const predictedDemand = selectedMeal?.predicted_demand || 0;
  const bufferAmount = selectedMeal?.buffer_amount || 0;

  let dynamicStatus: ConsumptionStatus = 'SAFE';
  if (actualPrep !== '' && actualCons !== '') {
    if (currentShortage > 0) {
      dynamicStatus = 'SHORTAGE_RISK';
    } else if (consNum > predictedDemand) {
      dynamicStatus = 'BUFFER_USED';
    } else if (currentSurplus > bufferAmount * 1.5 && currentSurplus > 10) {
      dynamicStatus = 'SURPLUS_RISK';
    }
  }

  const isFormValid =
    selectedMealId !== '' &&
    actualPrep !== '' &&
    actualCons !== '' &&
    leftoverKg !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setSubmitting(true);
      const res = await api.logConsumption({
        mealId: Number(selectedMealId),
        actualPreparation: Number(actualPrep),
        actualConsumption: Number(actualCons),
        leftoverWeightKg: Number(leftoverKg),
        wasteReason: wasteReason.trim() || 'Logged at service close',
        actionTaken: actionTaken.trim() || 'Recorded in inventory',
      });
      setResultImpact(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert('Failed to log consumption: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="consumption-view" className="space-y-6 pb-16 max-w-4xl mx-auto text-slate-100">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Kitchen Service Turnout & Consumption Log
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Enter actual cooked quantities and headcount turnout directly from kitchen weighing records.
        </p>
      </div>

      <div className="card-shiny-black rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Meal Picker */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">
              Select Finished Meal Service
            </label>
            <select
              value={selectedMealId}
              onChange={(e) => setSelectedMealId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 font-bold text-white focus:outline-hidden focus:border-[#10f072]"
            >
              <option value="" disabled className="bg-zinc-900">-- Select a meal to log --</option>
              {meals.map((m) => (
                <option key={m.id} value={m.id} className="bg-zinc-900">
                  {m.date} - {m.meal_type} ({m.menu.slice(0, 35)}...) [Target Prep: {m.recommended_preparation || m.expected_attendance}]
                </option>
              ))}
            </select>
          </div>

          {selectedMeal && (
            <div className="p-4 bg-black/60 border border-zinc-800 rounded-2xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Scheduled Date</div>
                <div className="text-sm font-bold text-white mt-0.5">{selectedMeal.date}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Service Type</div>
                <div className="text-sm font-bold text-white mt-0.5">{selectedMeal.meal_type}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Predicted Demand</div>
                <div className="text-sm font-bold text-white mt-0.5">{selectedMeal.predicted_demand || selectedMeal.expected_attendance}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#10f072] font-bold uppercase">Planned Buffer</div>
                <div className="text-sm font-bold text-[#10f072] mt-0.5">+{selectedMeal.buffer_amount || 0} meals</div>
              </div>
            </div>
          )}

          {/* Direct Kitchen Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="actual-prep-input" className="font-bold text-slate-300 block mb-1">
                Actual Meals Prepared by Kitchen *
              </label>
              <input
                id="actual-prep-input"
                type="number"
                min="0"
                required
                placeholder="Type total meals prepared..."
                value={actualPrep}
                onChange={(e) => setActualPrep(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 text-sm font-black text-white focus:outline-hidden focus:border-[#10f072] bg-zinc-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Total cooked portion count produced by the kitchen staff.
              </span>
            </div>

            <div>
              <label htmlFor="actual-cons-input" className="font-bold text-slate-300 block mb-1">
                Actual Student Turnout (Meals Consumed) *
              </label>
              <input
                id="actual-cons-input"
                type="number"
                min="0"
                required
                placeholder="Type actual student headcount served..."
                value={actualCons}
                onChange={(e) => setActualCons(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 text-sm font-black text-white focus:outline-hidden focus:border-[#10f072] bg-zinc-900"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Total number of students who swiped or were served.
              </span>
            </div>
          </div>

          {/* Real-Time Live Calculation Bar based on user input */}
          {actualPrep !== '' && actualCons !== '' && (
            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Turnout Health Assessment:</span>
                <span
                  className={`px-3 py-1 rounded-full font-bold text-[11px] border ${
                    dynamicStatus === 'SHORTAGE_RISK'
                      ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                      : dynamicStatus === 'BUFFER_USED'
                      ? 'bg-sky-950/70 border-sky-500/50 text-sky-300'
                      : dynamicStatus === 'SURPLUS_RISK'
                      ? 'bg-amber-950/70 border-amber-500/50 text-amber-300'
                      : 'bg-emerald-950/70 border-emerald-500/50 text-[#10f072]'
                  }`}
                >
                  {dynamicStatus.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-black/60 rounded-xl border border-zinc-800">
                  <span className="text-slate-400 block">Surplus Leftover:</span>
                  <span className="text-lg font-black text-white">{currentSurplus} meals</span>
                </div>

                <div className="p-3 bg-black/60 rounded-xl border border-zinc-800">
                  <span className="text-slate-400 block">Shortage Deficit:</span>
                  <span className={`text-lg font-black ${currentShortage > 0 ? 'text-rose-400' : 'text-[#10f072]'}`}>
                    {currentShortage > 0 ? `-${currentShortage} meals short` : 'Zero (0) Shortage'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Leftovers & Waste Disposition Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="leftover-kg-input" className="font-bold text-slate-300 block mb-1">
                Leftover Food Weight (kg) *
              </label>
              <input
                id="leftover-kg-input"
                type="number"
                step="0.1"
                min="0"
                required
                placeholder="Type scale weight in kg..."
                value={leftoverKg}
                onChange={(e) => setLeftoverKg(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 text-sm font-black text-white focus:outline-hidden focus:border-[#10f072] bg-zinc-900"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Measured on mess scale</span>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="waste-reason-input" className="font-bold text-slate-300 block mb-1">
                Primary Cause of Leftover / Notes
              </label>
              <input
                id="waste-reason-input"
                type="text"
                placeholder="Type primary cause of leftover food..."
                value={wasteReason}
                onChange={(e) => setWasteReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 text-xs text-white focus:outline-hidden focus:border-[#10f072] bg-zinc-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="action-taken-input" className="font-bold text-slate-300 block mb-1">
              Surplus Action & Destination
            </label>
            <input
              id="action-taken-input"
              type="text"
              placeholder="Type surplus action or destination..."
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 text-xs text-white focus:outline-hidden focus:border-[#10f072] bg-zinc-900"
            />
          </div>

          <div className="pt-3 border-t border-zinc-800 flex justify-end">
            <button
              id="submit-consumption-btn"
              type="submit"
              disabled={!isFormValid || submitting}
              className="btn-bubble-green px-6 py-2.5 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,240,114,0.35)] transition-all disabled:opacity-40 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Saving to Database...' : 'Save Consumption & Calibrate Model'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Success Impact Banner in Shiny Black */}
      {resultImpact && (
        <div className="card-shiny-black border border-emerald-500/40 rounded-3xl p-6 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-[#10f072] font-bold">
            <CheckCircle2 className="w-5 h-5 text-[#10f072]" />
            <span>Turnout Logged Successfully & Learning Loop Calibrated!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-black/60 p-4 rounded-2xl border border-zinc-800">
              <span className="text-[10px] text-slate-400 block font-bold">FOOD PRESERVED</span>
              <span className="text-xl font-black text-[#10f072]">{resultImpact.impact?.food_saved_kg || 0} kg</span>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-zinc-800">
              <span className="text-[10px] text-slate-400 block font-bold">BUDGET SAVED</span>
              <span className="text-xl font-black text-amber-400">₹{resultImpact.impact?.cost_saved_inr || 0}</span>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-zinc-800">
              <span className="text-[10px] text-slate-400 block font-bold">CO₂e CUT</span>
              <span className="text-xl font-black text-sky-400">{resultImpact.impact?.co2_avoided_kg || 0} kg</span>
            </div>
            <div className="bg-black/60 p-4 rounded-2xl border border-zinc-800">
              <span className="text-[10px] text-slate-400 block font-bold">WATER SAVED</span>
              <span className="text-xl font-black text-indigo-400">{resultImpact.impact?.water_avoided_liters || 0} L</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
