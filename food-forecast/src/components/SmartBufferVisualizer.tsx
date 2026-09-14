import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Info,
  Sparkles,
  Sliders,
  Utensils,
  Leaf,
  IndianRupee,
  Droplets,
  PlusCircle,
  Flame,
} from 'lucide-react';
import { calculateBuffer, calculateConsumptionMetrics, calculateImpact } from '../../server/calculations';
import { api } from '../api';

interface SmartBufferVisualizerProps {
  predictedDemand?: number;
  bufferPercent?: number;
  bufferAmount?: number;
  recommendedPreparation?: number;
  actualConsumption?: number;
  status?: string;
  mealType?: string;
  onMealSaved?: () => void;
}

export const SmartBufferVisualizer: React.FC<SmartBufferVisualizerProps> = ({
  predictedDemand: initialPredicted = 400,
  bufferPercent: initialBuffer = 5.0,
  bufferAmount: initialBufferAmount = 20,
  recommendedPreparation: initialPrep = 420,
  actualConsumption: initialActual = 410,
  status: initialStatus = 'BUFFER_USED',
  mealType: initialMealType = 'Lunch',
  onMealSaved,
}) => {
  // Mode toggle: 'custom' (Direct Input Lab) or 'live' (Operational DB meal)
  const [activeMode, setActiveMode] = useState<'custom' | 'live'>('custom');

  // Interactive user custom inputs
  const [userHeadcount, setUserHeadcount] = useState<number | ''>(450);
  const [userBufferPercent, setUserBufferPercent] = useState<number | ''>(6.0);
  const [userActualTurnout, setUserActualTurnout] = useState<number | ''>(465);
  const [userMealType, setUserMealType] = useState<string>('Lunch');
  const [userCostPerMeal, setUserCostPerMeal] = useState<number | ''>(45);

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Dynamic real-time calculation based on user inputs
  const calculation = useMemo(() => {
    const isCustom = activeMode === 'custom';

    const demand = isCustom
      ? Math.max(0, Number(userHeadcount) || 0)
      : initialPredicted;

    const bufferPct = isCustom
      ? Math.max(0, Math.min(50, Number(userBufferPercent) || 0))
      : initialBuffer;

    const bufferResult = calculateBuffer({
      predictedDemand: demand,
      bufferPercent: bufferPct,
    });

    const prep = bufferResult.recommendedPreparation;
    const bufAmt = bufferResult.bufferAmount;

    const actual = isCustom
      ? Math.max(0, Number(userActualTurnout) || 0)
      : initialActual;

    const cost = isCustom
      ? Math.max(1, Number(userCostPerMeal) || 45)
      : 45;

    const consumptionResult = calculateConsumptionMetrics({
      predictedDemand: demand,
      bufferAmount: bufAmt,
      actualPreparation: prep,
      actualConsumption: actual,
    });

    const impactResult = calculateImpact({
      surplus: consumptionResult.surplus,
      actualConsumption: actual,
      costPerMeal: cost,
    });

    return {
      demand,
      bufferPct,
      bufferAmount: bufAmt,
      preparation: prep,
      actual,
      cost,
      status: consumptionResult.status,
      surplus: consumptionResult.surplus,
      shortage: consumptionResult.shortage,
      bufferUtilized: consumptionResult.bufferUtilized,
      mealsSaved: impactResult.mealsSaved,
      foodSavedKg: impactResult.foodSavedKg,
      costSavedInr: impactResult.costSavedInr,
      co2AvoidedKg: impactResult.co2AvoidedKg,
      waterAvoidedLiters: impactResult.waterAvoidedLiters,
    };
  }, [
    activeMode,
    userHeadcount,
    userBufferPercent,
    userActualTurnout,
    userCostPerMeal,
    initialPredicted,
    initialBuffer,
    initialPrep,
    initialActual,
  ]);

  // Visual bar width calculations
  const maxScale = Math.max(calculation.preparation * 1.15, calculation.actual + 30, 100);
  const baseWidthPct = Math.min(100, (calculation.demand / maxScale) * 100);
  const bufferWidthPct = Math.min(100 - baseWidthPct, (calculation.bufferAmount / maxScale) * 100);
  const consumptionMarkerPct = Math.min(98, Math.max(2, (calculation.actual / maxScale) * 100));

  const getStatusBadge = () => {
    switch (calculation.status) {
      case 'SHORTAGE_RISK':
        return {
          bg: 'bg-rose-950/70 border-rose-500/50 text-rose-300',
          dot: 'bg-rose-500 animate-ping',
          icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
          label: 'SHORTAGE RISK',
          desc: `Turnout exceeded preparation by ${calculation.shortage} meals! Additional emergency buffer needed.`,
        };
      case 'BUFFER_USED':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/50 text-[#10f072]',
          dot: 'bg-[#10f072]',
          icon: <ShieldCheck className="w-4 h-4 text-[#10f072]" />,
          label: 'BUFFER ACTIVATED & SAFE',
          desc: `Safety buffer absorbed +${calculation.bufferUtilized} unexpected diners with zero student shortage!`,
        };
      case 'SURPLUS_RISK':
        return {
          bg: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
          dot: 'bg-amber-400',
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          label: 'SURPLUS RISK',
          desc: `Turnout lower than forecast. Surplus of ${calculation.surplus} meals exceeds standard scrap ceiling.`,
        };
      case 'SAFE':
      default:
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          label: 'OPTIMAL & CALIBRATED',
          desc: 'Preparation perfectly calibrated. Zero student shortfall and controlled leftover scrap.',
        };
    }
  };

  const badge = getStatusBadge();

  const handleSaveAsLiveMeal = async () => {
    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];
      await api.createMeal({
        date: today,
        mealType: userMealType,
        menu: `Custom Menu (${calculation.demand} Expected)`,
        expectedAttendance: calculation.demand,
        costPerMeal: Number(userCostPerMeal) || 45,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      if (onMealSaved) onMealSaved();
    } catch (err: any) {
      console.error('Failed to deploy custom meal:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="smart-buffer-visualizer"
      className="card-shiny-black rounded-3xl p-6 sm:p-7 relative overflow-hidden text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.85)] border border-zinc-800"
    >
      {/* Top Glossy Gradient Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#10f072] to-teal-400 shadow-[0_0_15px_rgba(16,240,114,0.6)]" />

      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-black border border-[#10f072]/40 text-[#10f072] shadow-[0_0_15px_rgba(16,240,114,0.3)]">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="font-extrabold text-white text-xl tracking-tight font-display">
              Intelligent Safety Buffer Engine
            </h2>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-[#10f072]/15 text-[#10f072] border border-[#10f072]/30 uppercase tracking-wider">
              {activeMode === 'custom' ? `Custom Mode: ${userMealType}` : initialMealType}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Give your own numbers to forecast demand, test turnout surges, and calculate sustainability metrics live.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-black/60 p-1 rounded-full border border-zinc-800">
            <button
              id="mode-custom-btn"
              type="button"
              onClick={() => setActiveMode('custom')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeMode === 'custom'
                  ? 'btn-bubble-green'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Enter My Inputs</span>
            </button>
            <button
              id="mode-live-btn"
              type="button"
              onClick={() => setActiveMode('live')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeMode === 'live'
                  ? 'btn-bubble-green'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Utensils className="w-3 h-3" />
              <span>Operational Meal</span>
            </button>
          </div>

          {/* Live Status Badge */}
          <div className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${badge.bg}`}>
            <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        </div>
      </div>

      {/* DIRECT USER INPUT SECTION (When activeMode is 'custom') */}
      {activeMode === 'custom' && (
        <div id="direct-user-inputs-bar" className="mt-5 p-4 sm:p-5 rounded-2xl bg-black/60 border border-zinc-800/90 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-[#10f072] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Your Custom Input Parameters (Live Dynamic Calculation)
            </span>
            <span className="text-[11px] text-slate-400">
              Type or change any value below to see all outputs update instantly:
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Expected Headcount */}
            <div className="space-y-1">
              <label htmlFor="input-headcount" className="block text-[11px] font-bold text-slate-300">
                1. Expected Headcount
              </label>
              <input
                id="input-headcount"
                type="number"
                min="1"
                placeholder="e.g. 450"
                value={userHeadcount}
                onChange={(e) => setUserHeadcount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700 font-extrabold text-sm text-white focus:outline-hidden focus:border-[#10f072] focus:ring-1 focus:ring-[#10f072]"
              />
              <span className="text-[10px] text-slate-500 block">Enrolled / planned diners</span>
            </div>

            {/* 2. Safety Buffer % */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="input-buffer" className="text-[11px] font-bold text-slate-300">
                  2. Safety Buffer %
                </label>
                <span className="text-xs font-black text-[#10f072]">
                  +{userBufferPercent || 0}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="input-buffer"
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={userBufferPercent}
                  onChange={(e) => setUserBufferPercent(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-20 px-2.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700 font-extrabold text-sm text-white focus:outline-hidden focus:border-[#10f072]"
                />
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="0.5"
                  value={userBufferPercent === '' ? 5 : Number(userBufferPercent)}
                  onChange={(e) => setUserBufferPercent(Number(e.target.value))}
                  className="w-full accent-[#10f072] cursor-pointer"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">Surge padding allowance</span>
            </div>

            {/* 3. Actual Turnout Test */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="input-turnout" className="text-[11px] font-bold text-slate-300">
                  3. Actual Attendance
                </label>
                <span className="text-xs font-black text-sky-400">
                  {userActualTurnout || 0} diners
                </span>
              </div>
              <input
                id="input-turnout"
                type="number"
                min="0"
                placeholder="e.g. 465"
                value={userActualTurnout}
                onChange={(e) => setUserActualTurnout(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700 font-extrabold text-sm text-white focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
              />
              <span className="text-[10px] text-slate-500 block">Simulate unexpected rush/drop</span>
            </div>

            {/* 4. Meal Service Type */}
            <div className="space-y-1">
              <label htmlFor="input-meal-type" className="block text-[11px] font-bold text-slate-300">
                4. Meal Service
              </label>
              <select
                id="input-meal-type"
                value={userMealType}
                onChange={(e) => setUserMealType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700 font-bold text-sm text-white focus:outline-hidden focus:border-[#10f072]"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Snacks">Snacks</option>
                <option value="Dinner">Dinner</option>
              </select>
              <span className="text-[10px] text-slate-500 block">Daily campus slot</span>
            </div>

            {/* 5. Cost Per Meal (₹) */}
            <div className="space-y-1">
              <label htmlFor="input-cost" className="block text-[11px] font-bold text-slate-300">
                5. Cost / Meal (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  id="input-cost"
                  type="number"
                  min="1"
                  value={userCostPerMeal}
                  onChange={(e) => setUserCostPerMeal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-700 font-extrabold text-sm text-white focus:outline-hidden focus:border-[#10f072]"
                />
              </div>
              <span className="text-[10px] text-slate-500 block">Unit catering cost</span>
            </div>
          </div>
        </div>
      )}

      {/* 4-Step Mathematical Flow Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-6">
        {/* Step 1: Base Demand */}
        <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800 flex flex-col justify-between shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            1. Base Forecast
          </div>
          <div className="my-2.5">
            <span className="text-3xl font-black text-white tracking-tight font-display">
              {calculation.demand}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">meals</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Enrolled / expected attendance
          </div>
        </div>

        {/* Step 2: Dynamic Buffer */}
        <div className="bg-emerald-950/40 rounded-2xl p-4 border border-emerald-500/30 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="text-[11px] font-bold text-[#10f072] uppercase tracking-wider flex items-center justify-between">
            <span>2. Safety Buffer</span>
            <span className="bg-[#10f072]/20 text-[#10f072] font-black px-2 py-0.5 rounded-full text-[10px] border border-[#10f072]/40">
              +{calculation.bufferPct}%
            </span>
          </div>
          <div className="my-2.5">
            <span className="text-3xl font-black text-[#10f072] tracking-tight font-display">
              +{calculation.bufferAmount}
            </span>
            <span className="text-xs text-emerald-400 ml-1.5 font-medium">cushion</span>
          </div>
          <div className="text-[11px] text-emerald-300">
            Surge cushion: protects from food shortages
          </div>
        </div>

        {/* Step 3: Recommended Preparation */}
        <div className="bg-zinc-900/90 rounded-2xl p-4 border border-[#10f072]/50 flex flex-col justify-between shadow-[0_0_20px_rgba(16,240,114,0.15)]">
          <div className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center justify-between">
            <span>3. Recommended Prep</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
              Kitchen Target
            </span>
          </div>
          <div className="my-2.5">
            <span className="text-3xl font-black text-white tracking-tight font-display">
              {calculation.preparation}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">
              meals ({(calculation.preparation * 0.4).toFixed(1)} kg)
            </span>
          </div>
          <div className="text-[11px] text-[#10f072] font-semibold">
            Optimal quantity to cook
          </div>
        </div>

        {/* Step 4: Actual Turnout vs Target */}
        <div
          className={`rounded-2xl p-4 border flex flex-col justify-between ${
            calculation.status === 'SHORTAGE_RISK'
              ? 'bg-rose-950/60 border-rose-500/50 text-rose-200'
              : calculation.status === 'BUFFER_USED'
              ? 'bg-sky-950/60 border-sky-500/50 text-sky-200'
              : 'bg-zinc-900/80 border-zinc-800 text-slate-200'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-90 flex items-center justify-between">
            <span>4. Actual Diners</span>
            <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-bold">
              {calculation.actual > calculation.demand ? `+${calculation.actual - calculation.demand} Surge` : 'Normal'}
            </span>
          </div>
          <div className="my-2.5">
            <span className="text-3xl font-black tracking-tight font-display text-white">
              {calculation.actual}
            </span>
            <span className="text-xs opacity-70 ml-1.5 font-medium">attended</span>
          </div>
          <div className="text-[11px] font-bold">
            {calculation.status === 'SHORTAGE_RISK'
              ? `Shortage: -${calculation.shortage} meals`
              : calculation.status === 'BUFFER_USED'
              ? `Buffer absorbed: ${calculation.bufferUtilized}/${calculation.bufferAmount} meals`
              : `Controlled surplus: ${calculation.surplus} meals`}
          </div>
        </div>
      </div>

      {/* Visual Dynamic Buffer Allocation Bar */}
      <div className="bg-black/70 rounded-2xl p-5 border border-zinc-800 mb-6">
        <div className="flex flex-wrap justify-between text-xs text-slate-300 mb-2.5 font-medium gap-2">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-600 inline-block" />
            Base Demand: <strong className="text-white">{calculation.demand}</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#10f072] inline-block shadow-[0_0_8px_rgba(16,240,114,0.8)]" />
            Dynamic Buffer: <strong className="text-[#10f072]">+{calculation.bufferAmount} ({calculation.bufferPct}%)</strong>
          </span>
          <span className="flex items-center gap-1.5 font-bold text-white">
            Recommended Cook Target: <span className="text-[#10f072]">{calculation.preparation} meals</span>
          </span>
        </div>

        {/* Progress Track */}
        <div className="h-9 w-full bg-zinc-900 rounded-xl overflow-hidden flex relative shadow-inner border border-zinc-800">
          {/* Base demand segment */}
          <div
            style={{ width: `${baseWidthPct}%` }}
            className="h-full bg-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-200 tracking-wide transition-all duration-300"
            title={`Base Predicted Demand: ${calculation.demand}`}
          >
            Base: {calculation.demand}
          </div>

          {/* Buffer cushion segment */}
          <div
            style={{ width: `${bufferWidthPct}%` }}
            className="h-full bg-[#10f072] flex items-center justify-center text-xs font-black text-black tracking-wide border-l border-black/30 shadow-[0_0_15px_rgba(16,240,114,0.6)] transition-all duration-300"
            title={`Safety Buffer: +${calculation.bufferAmount}`}
          >
            +{calculation.bufferAmount}
          </div>

          {/* Actual consumption indicator pointer */}
          <div
            style={{ left: `${consumptionMarkerPct}%` }}
            className="absolute top-0 bottom-0 w-1.5 bg-white z-10 -ml-0.5 shadow-[0_0_12px_#fff] flex items-center justify-center transition-all duration-300"
          >
            <div className="absolute -top-3.5 px-2 py-0.5 rounded-full bg-white text-[10px] text-black font-black whitespace-nowrap -translate-x-1/2 shadow-lg border border-black/20">
              Turnout: {calculation.actual}
            </div>
          </div>
        </div>

        {/* Status explanation line */}
        <div className="mt-4 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#10f072] shrink-0" />
            <span>{badge.desc}</span>
          </span>
          <span className="font-bold">
            {calculation.actual <= calculation.preparation ? (
              <span className="text-[#10f072] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> 100% Student Demand Satisfied
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1 font-bold">
                <AlertTriangle className="w-4 h-4" /> Shortage of {calculation.shortage} plates!
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Live Financial & Sustainability Impact Generated from Your Input */}
      <div className="bg-zinc-950/90 rounded-2xl p-4 sm:p-5 border border-zinc-800/90 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Money Saved */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-[#10f072]" />
            Money Saved
          </div>
          <div className="text-xl sm:text-2xl font-black text-white font-display">
            ₹{calculation.costSavedInr.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400">
            vs 15% unmanaged over-prep
          </div>
        </div>

        {/* 2. Food Rescued */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5 text-[#10f072]" />
            Food Saved
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#10f072] font-display">
            {calculation.foodSavedKg} kg
          </div>
          <div className="text-[10px] text-slate-400">
            ({calculation.mealsSaved} meals diverted)
          </div>
        </div>

        {/* 3. Carbon Avoided */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            CO₂e Avoided
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-display">
            {calculation.co2AvoidedKg} kg
          </div>
          <div className="text-[10px] text-slate-400">
            2.5 kg CO₂e per kg food
          </div>
        </div>

        {/* 4. Water Saved */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-sky-400" />
            Water Saved
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-300 font-display">
            {calculation.waterAvoidedLiters.toLocaleString()} L
          </div>
          <div className="text-[10px] text-slate-400">
            Agricultural footprint saved
          </div>
        </div>
      </div>

      {/* Quick Action: Save / Push to Real Database with Bubble Green Button */}
      {activeMode === 'custom' && (
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Ready with your calculation? You can deploy this as today's live meal in the database:
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs font-bold text-[#10f072] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Deployed to SQLite Database!
              </span>
            )}
            <button
              id="deploy-custom-meal-btn"
              type="button"
              disabled={saving || calculation.demand <= 0}
              onClick={handleSaveAsLiveMeal}
              className="btn-bubble-green px-5 py-2.5 rounded-full text-xs font-black shadow-[0_0_20px_rgba(16,240,114,0.4)] flex items-center gap-2 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{saving ? 'Deploying to DB...' : 'Save As Live Meal in DB'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
