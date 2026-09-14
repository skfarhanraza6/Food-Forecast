import React, { useState, useEffect } from 'react';
import {
  Sliders,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Check,
  Info,
  ShieldCheck,
  Scale,
  Edit3,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { Meal } from '../types';

export const SimulatorView: React.FC = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  
  // User input modes: 'custom' (user types all values) or 'meal' (user selects meal then enters delta)
  const [inputMode, setInputMode] = useState<'custom' | 'meal'>('custom');

  // Custom User Inputs with responsive initial numbers so it renders immediately
  const [customBaseline, setCustomBaseline] = useState<number | ''>(400);
  const [customDelta, setCustomDelta] = useState<number | ''>(20);
  const [customBufferPercent, setCustomBufferPercent] = useState<number | ''>(5.5);
  const [customPrepOverride, setCustomPrepOverride] = useState<number | ''>('');
  const [customMealType, setCustomMealType] = useState<string>('Lunch');

  // Meal Selection Mode
  const [selectedMealId, setSelectedMealId] = useState<number | null>(null);
  const [mealDelta, setMealDelta] = useState<number | ''>(15);

  // Result state
  const [simulationResult, setSimulationResult] = useState<{
    mealId: number;
    mealType: string;
    date: string;
    basePrediction: number;
    bufferPercent: number;
    bufferAmount: number;
    currentPreparation: number;
    additionalStudents: number;
    newExpectedDemand: number;
    bufferRemaining: number;
    shortage: number;
    status: 'SAFE' | 'BUFFER_USED' | 'SHORTAGE_RISK';
    recommendedAction: string;
    applied: boolean;
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [applying, setApplying] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load active or upcoming meals
  useEffect(() => {
    async function loadMeals() {
      try {
        const res = await api.getMeals();
        setMeals(res.meals || []);
        if (res.meals && res.meals.length > 0) {
          setSelectedMealId(res.meals[0].id);
        }
      } catch (err) {
        console.error('Failed to load meals for simulator:', err);
      }
    }
    loadMeals();
  }, []);

  // Run simulation whenever user changes inputs
  useEffect(() => {
    runSimulation(false);
  }, [inputMode, customBaseline, customDelta, customBufferPercent, customPrepOverride, customMealType, selectedMealId, mealDelta]);

  const runSimulation = async (apply: boolean = false) => {
    try {
      if (apply) setApplying(true);
      else setLoading(true);

      let payload: any = {};

      if (inputMode === 'custom') {
        if (customBaseline === '' || isNaN(Number(customBaseline))) {
          setSimulationResult(null);
          return;
        }
        payload = {
          customBaselineDemand: Number(customBaseline),
          additionalStudents: customDelta === '' ? 0 : Number(customDelta),
          customBufferPercent: customBufferPercent === '' ? 5.0 : Number(customBufferPercent),
          manualPreparationOverride: customPrepOverride === '' ? undefined : Number(customPrepOverride),
          mealType: customMealType,
          applyScenario: false,
        };
      } else {
        if (!selectedMealId) return;
        payload = {
          mealId: selectedMealId,
          additionalStudents: mealDelta === '' ? 0 : Number(mealDelta),
          applyScenario: apply,
        };
      }

      const res = await api.simulateDemand(payload);
      setSimulationResult(res);

      if (apply && res.applied) {
        setNotification({
          type: 'success',
          message: `Simulation applied! Meal preparation updated to ${res.newExpectedDemand + res.bufferAmount} meals in the database.`,
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (err: any) {
      console.error('Simulation error:', err);
      setNotification({
        type: 'error',
        message: err.message || 'Simulation calculation failed',
      });
    } finally {
      setLoading(false);
      setApplying(false);
    }
  };

  const selectedMeal = meals.find((m) => m.id === selectedMealId);
  const canApply = (user?.role === 'ADMIN' || user?.role === 'STAFF') && inputMode === 'meal';

  return (
    <div id="simulator-view" className="space-y-6 pb-16 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Dynamic Turnout Surge Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Test how unexpected student surges or dropouts affect food buffer health and kitchen preparation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">Simulator Engine:</span>
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#10f072]/15 text-[#10f072] border border-[#10f072]/40">
            Real-Time Reactive
          </span>
        </div>
      </div>

      {notification && (
        <div
          id="simulator-notification"
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-[#10f072]'
              : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#10f072]" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Controls vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Controller Card */}
        <div className="lg:col-span-5 card-shiny-black rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-base mb-1">
              <span className="p-1.5 rounded-xl bg-black border border-[#10f072]/40 text-[#10f072]">
                <Sliders className="w-4 h-4" />
              </span>
              <h3>Simulation Input Controller</h3>
            </div>
            <p className="text-xs text-slate-400">
              Provide your baseline numbers or choose an active scheduled meal.
            </p>

            {/* Input Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 bg-black/60 p-1.5 rounded-full border border-zinc-800 mt-4">
              <button
                type="button"
                id="sim-mode-custom-btn"
                onClick={() => setInputMode('custom')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inputMode === 'custom'
                    ? 'btn-bubble-green'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Type My Values</span>
              </button>

              <button
                type="button"
                id="sim-mode-meal-btn"
                onClick={() => setInputMode('meal')}
                className={`py-2 px-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  inputMode === 'meal'
                    ? 'btn-bubble-green'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Select Existing Meal</span>
              </button>
            </div>
          </div>

          {inputMode === 'custom' ? (
            /* Custom User Inputs Form */
            <div className="space-y-4 pt-2 border-t border-zinc-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sim-custom-meal-type" className="block text-xs font-bold text-slate-300 mb-1">
                    Meal Service
                  </label>
                  <select
                    id="sim-custom-meal-type"
                    value={customMealType}
                    onChange={(e) => setCustomMealType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 text-xs font-bold text-white bg-zinc-900 focus:outline-hidden focus:border-[#10f072]"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dinner">Dinner</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sim-custom-buffer-input" className="block text-xs font-bold text-slate-300 mb-1">
                    Buffer Margin (%)
                  </label>
                  <input
                    id="sim-custom-buffer-input"
                    type="number"
                    step="0.5"
                    min="0"
                    max="30"
                    placeholder="Enter buffer %"
                    value={customBufferPercent}
                    onChange={(e) => setCustomBufferPercent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700 text-xs font-bold text-white bg-zinc-900 focus:outline-hidden focus:border-[#10f072]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="sim-custom-baseline-input" className="block text-xs font-bold text-slate-300 mb-1">
                  Baseline Expected Students (Attendance)
                </label>
                <input
                  id="sim-custom-baseline-input"
                  type="number"
                  min="0"
                  placeholder="Type baseline attendance count..."
                  value={customBaseline}
                  onChange={(e) => setCustomBaseline(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 text-sm font-black text-white bg-zinc-900 focus:outline-hidden focus:border-[#10f072] focus:ring-1 focus:ring-[#10f072]"
                />
              </div>

              <div>
                <label htmlFor="sim-custom-delta-input" className="block text-xs font-bold text-slate-300 mb-1">
                  Attendance Variance / Delta (+/- Students)
                </label>
                <input
                  id="sim-custom-delta-input"
                  type="number"
                  placeholder="Enter positive or negative variance count..."
                  value={customDelta}
                  onChange={(e) => setCustomDelta(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 text-sm font-black text-white bg-zinc-900 focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Positive number for attendance surge, negative number for turnout drop.
                </span>
              </div>

              <div>
                <label htmlFor="sim-custom-prep-override" className="block text-xs font-bold text-slate-300 mb-1">
                  Planned Portions to Cook (Optional Override)
                </label>
                <input
                  id="sim-custom-prep-override"
                  type="number"
                  min="0"
                  placeholder="Leave empty to auto-calculate with buffer"
                  value={customPrepOverride}
                  onChange={(e) => setCustomPrepOverride(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 text-xs font-bold text-white bg-zinc-900 focus:outline-hidden focus:border-[#10f072]"
                />
              </div>
            </div>
          ) : (
            /* Existing Meal Mode */
            <div className="space-y-4 pt-2 border-t border-zinc-800">
              <div>
                <label htmlFor="sim-meal-select" className="block text-xs font-bold text-slate-300 mb-1">
                  Select Meal from Database
                </label>
                <select
                  id="sim-meal-select"
                  value={selectedMealId || ''}
                  onChange={(e) => setSelectedMealId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 text-xs font-bold text-white bg-zinc-900 focus:outline-hidden focus:border-[#10f072]"
                >
                  {meals.map((meal) => (
                    <option key={meal.id} value={meal.id}>
                      {meal.date} • {meal.meal_type} ({meal.menu})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMeal && (
                <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-800 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Baseline Demand:</span>
                    <span className="font-bold text-white">{selectedMeal.predicted_demand || selectedMeal.expected_attendance} meals</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Cook Quantity:</span>
                    <span className="font-bold text-white">{selectedMeal.recommended_preparation} meals</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Buffer:</span>
                    <span className="font-bold text-[#10f072]">
                      +{selectedMeal.buffer_amount} ({selectedMeal.recommended_buffer_percent}%)
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="sim-meal-delta-input" className="block text-xs font-bold text-slate-300 mb-1">
                  Simulate Attendance Delta (+/- Diners)
                </label>
                <input
                  id="sim-meal-delta-input"
                  type="number"
                  value={mealDelta}
                  onChange={(e) => setMealDelta(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. +25 or -30"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 text-sm font-black text-white bg-zinc-900 focus:outline-hidden focus:border-[#10f072]"
                />
              </div>

              <div className="pt-2">
                <button
                  id="sim-apply-btn"
                  type="button"
                  disabled={!canApply || applying}
                  onClick={() => runSimulation(true)}
                  className={`w-full py-2.5 px-4 rounded-full text-xs font-black flex items-center justify-center gap-2 transition-all ${
                    canApply
                      ? 'btn-bubble-green shadow-[0_0_15px_rgba(16,240,114,0.35)]'
                      : 'bg-zinc-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{applying ? 'Updating DB...' : 'Apply Adjustment to Live Schedule'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Simulation Results & Impact Cards in Shiny Black */}
        <div className="lg:col-span-7 space-y-5">
          {simulationResult ? (
            <>
              {/* Status Banner */}
              <div
                id="sim-status-banner"
                className={`p-5 rounded-3xl border ${
                  simulationResult.status === 'SHORTAGE_RISK'
                    ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                    : simulationResult.status === 'BUFFER_USED'
                    ? 'bg-sky-950/70 border-sky-500/50 text-sky-200'
                    : 'bg-emerald-950/70 border-emerald-500/50 text-[#10f072]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {simulationResult.status === 'SHORTAGE_RISK' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : simulationResult.status === 'BUFFER_USED' ? (
                    <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-[#10f072] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider">
                      {simulationResult.status === 'SHORTAGE_RISK'
                        ? 'Shortage Risk Detected'
                        : simulationResult.status === 'BUFFER_USED'
                        ? 'Buffer Absorbed Surge'
                        : 'Safe Operating Envelope'}
                    </div>
                    <p className="text-sm font-semibold mt-1">
                      {simulationResult.recommendedAction}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Quantitative Result Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400">Baseline Demand</span>
                  <div className="text-2xl font-black text-white mt-1 font-display">
                    {simulationResult.basePrediction}
                  </div>
                  <span className="text-[10px] text-slate-400">Headcount</span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400">Simulated Demand</span>
                  <div className="text-2xl font-black text-sky-400 mt-1 font-display">
                    {simulationResult.newExpectedDemand}
                  </div>
                  <span className="text-[10px] text-sky-300 font-bold">
                    {simulationResult.additionalStudents >= 0
                      ? `+${simulationResult.additionalStudents}`
                      : simulationResult.additionalStudents} variance
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400">Planned Cooked</span>
                  <div className="text-2xl font-black text-white mt-1 font-display">
                    {simulationResult.currentPreparation}
                  </div>
                  <span className="text-[10px] text-[#10f072] font-bold">
                    +{simulationResult.bufferAmount} ({simulationResult.bufferPercent}%) buffer
                  </span>
                </div>

                <div className={`p-4 rounded-2xl border shadow-xs ${
                  simulationResult.shortage > 0
                    ? 'bg-rose-950/60 border-rose-500/50'
                    : 'bg-emerald-950/60 border-emerald-500/50'
                }`}>
                  <span className="text-[11px] font-bold text-slate-300">
                    {simulationResult.shortage > 0 ? 'Deficit / Shortage' : 'Buffer Remaining'}
                  </span>
                  <div className={`text-2xl font-black mt-1 font-display ${
                    simulationResult.shortage > 0 ? 'text-rose-400' : 'text-[#10f072]'
                  }`}>
                    {simulationResult.shortage > 0 ? `-${simulationResult.shortage}` : `+${simulationResult.bufferRemaining}`}
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium">
                    {simulationResult.shortage > 0 ? 'Unmet diners' : 'Meals headroom'}
                  </span>
                </div>
              </div>

              {/* Graphical Allocation Bar */}
              <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Dynamic Allocation Stack</span>
                  <span>Max Scale: {Math.max(simulationResult.currentPreparation, simulationResult.newExpectedDemand)} meals</span>
                </div>

                <div className="h-7 w-full bg-zinc-900 rounded-xl overflow-hidden flex relative border border-zinc-800">
                  <div
                    style={{
                      width: `${Math.min(100, (simulationResult.basePrediction / Math.max(1, simulationResult.currentPreparation)) * 100)}%`,
                    }}
                    className="h-full bg-slate-600 flex items-center justify-center text-[10px] font-bold text-white"
                    title="Baseline Demand"
                  >
                    Base ({simulationResult.basePrediction})
                  </div>
                  {simulationResult.additionalStudents > 0 && (
                    <div
                      style={{
                        width: `${Math.min(
                          100 - (simulationResult.basePrediction / Math.max(1, simulationResult.currentPreparation)) * 100,
                          (simulationResult.additionalStudents / Math.max(1, simulationResult.currentPreparation)) * 100
                        )}%`,
                      }}
                      className={`h-full ${simulationResult.shortage > 0 ? 'bg-rose-500' : 'bg-[#10f072] text-black font-black'} flex items-center justify-center text-[10px]`}
                      title="Surge Delta"
                    >
                      +{simulationResult.additionalStudents}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                    <span>Baseline ({simulationResult.basePrediction})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10f072] inline-block shadow-[0_0_6px_rgba(16,240,114,0.8)]" />
                    <span>Absorbed Surge</span>
                  </div>
                  {simulationResult.shortage > 0 && (
                    <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <span>Unmet Shortfall ({simulationResult.shortage})</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center card-shiny-black rounded-3xl border border-zinc-800 text-slate-400 text-xs">
              Type your attendance values on the left to compute live simulation metrics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
