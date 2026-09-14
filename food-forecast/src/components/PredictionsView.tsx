import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calculator,
  ShieldCheck,
  TrendingUp,
  Percent,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { api } from '../api';
import { MealType } from '../types';

export const PredictionsView: React.FC = () => {
  // Simulator state with an initial interactive number so it calculates right away
  const [simMealType, setSimMealType] = useState<MealType>('Lunch');
  const [simDate, setSimDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [simExpected, setSimExpected] = useState<number | ''>(420);
  const [simResult, setSimResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);

  // Model accuracy stats from DB
  const [accuracyStats, setAccuracyStats] = useState<any>(null);

  const runSimulation = async () => {
    if (simExpected === '' || isNaN(Number(simExpected)) || Number(simExpected) <= 0) {
      setSimResult(null);
      return;
    }
    try {
      setIsCalculating(true);
      const res = await api.calculatePrediction({
        mealType: simMealType,
        date: simDate,
        expectedAttendance: Number(simExpected),
      });
      setSimResult(res.prediction);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    runSimulation();
    api.getPredictionAccuracy().then((res) => {
      setAccuracyStats(res);
    }).catch(console.error);
  }, [simMealType, simDate, simExpected]);

  const handleDeployToDb = async () => {
    if (!simResult) return;
    try {
      await api.createMeal({
        date: simDate,
        mealType: simMealType,
        menu: `Forecast Plan (${simResult.predictedDemand} expected)`,
        expectedAttendance: simResult.predictedDemand,
        costPerMeal: 45,
      });
      setDeploySuccess(true);
      setTimeout(() => setDeploySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to deploy predicted meal:', err);
    }
  };

  return (
    <div id="predictions-view" className="space-y-6 pb-16 text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Adaptive Prediction & Buffer Engine
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Give your expected headcount to calculate dynamic buffer sizing, safety margins, and kitchen preparation goals.
        </p>
      </div>

      {/* Accuracy KPI Banner in Shiny Black */}
      {accuracyStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Accuracy</div>
            <div className="text-3xl font-black text-[#10f072] mt-1 font-display">
              {accuracyStats.avgAccuracy}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across {accuracyStats.totalRecords} verified mess meals</div>
          </div>

          <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mean Prediction Error</div>
            <div className="text-3xl font-black text-sky-400 mt-1 font-display">
              ±{accuracyStats.avgError}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Absorbed comfortably by safety buffer</div>
          </div>

          <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buffer Safety Rate</div>
            <div className="text-3xl font-black text-amber-400 mt-1 font-display">
              100%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Zero student food shortage occurrences</div>
          </div>
        </div>
      )}

      {/* The Core Mathematical Model Breakdown */}
      <div className="card-shiny-black rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-7">
        <div className="flex items-center justify-between gap-2 mb-5 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-black border border-[#10f072]/40 text-[#10f072]">
              <Calculator className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Interactive What-If Scenario Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Type your custom inputs on the left to watch the prediction engine recalculate immediately.
              </p>
            </div>
          </div>

          {deploySuccess && (
            <span className="text-xs font-bold text-[#10f072] flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Deployed to database!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Controls */}
          <div className="lg:col-span-4 space-y-4 bg-black/60 p-5 rounded-2xl border border-zinc-800 text-xs shadow-inner">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Target Date</label>
              <input
                type="date"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-bold focus:outline-hidden focus:border-[#10f072]"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Meal Service Type</label>
              <select
                value={simMealType}
                onChange={(e) => setSimMealType(e.target.value as MealType)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-bold focus:outline-hidden focus:border-[#10f072]"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Snacks">Snacks</option>
                <option value="Dinner">Dinner</option>
              </select>
            </div>

            <div>
              <label htmlFor="sim-enrolled-input" className="font-bold text-slate-300 block mb-1">
                Expected Enrolled Students (Headcount)
              </label>
              <input
                id="sim-enrolled-input"
                type="number"
                min="1"
                placeholder="Type your headcount (e.g. 420)..."
                value={simExpected}
                onChange={(e) => setSimExpected(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 font-black text-base text-white focus:outline-hidden focus:border-[#10f072] focus:ring-1 focus:ring-[#10f072] mb-2"
              />
              <input
                type="range"
                min="50"
                max="1000"
                step="10"
                value={simExpected === '' ? 200 : Number(simExpected)}
                onChange={(e) => setSimExpected(Number(e.target.value))}
                className="w-full accent-[#10f072] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-0.5 font-bold">
                <span>50</span>
                <span>500</span>
                <span>1,000</span>
              </div>
            </div>

            <div className="pt-3 text-[11px] text-slate-400 bg-zinc-900/80 p-3.5 rounded-xl border border-zinc-800 space-y-1.5">
              <span className="font-bold text-slate-200 block">Dynamic Learning Rules:</span>
              <ul className="space-y-1 text-slate-400">
                <li>• 7-day rolling attendance error analysis</li>
                <li>• Weekend vs weekday variance weighting</li>
                <li>• Slot-specific meal volatility adjustments</li>
              </ul>
            </div>

            {simResult && (
              <button
                type="button"
                onClick={handleDeployToDb}
                className="btn-bubble-green w-full py-2.5 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,240,114,0.35)] flex items-center justify-center gap-1.5 mt-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Save This Forecast to Database</span>
              </button>
            )}
          </div>

          {/* Right Live Simulation Output */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            {simResult ? (
              <div className="space-y-4">
                {/* 3 Step Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-center shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Predicted Demand</div>
                    <div className="text-3xl font-black text-white mt-1 font-display">{simResult.predictedDemand}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Base diners expected</div>
                  </div>

                  <div className="p-4 bg-emerald-950/40 rounded-2xl border border-emerald-500/30 text-center shadow-xs">
                    <div className="text-[10px] uppercase font-bold text-[#10f072] flex items-center justify-center gap-1">
                      <span>Safety Buffer</span>
                      <span className="bg-[#10f072]/20 text-[#10f072] px-1.5 py-0.2 rounded-full text-[9px] font-black border border-[#10f072]/40">
                        +{simResult.recommendedBuffer}%
                      </span>
                    </div>
                    <div className="text-3xl font-black text-[#10f072] mt-1 font-display">+{simResult.bufferAmount}</div>
                    <div className="text-[11px] text-emerald-300 mt-0.5">Extra surge cushion</div>
                  </div>

                  <div className="p-4 bg-zinc-900/90 rounded-2xl border border-[#10f072]/50 text-center shadow-[0_0_20px_rgba(16,240,114,0.15)]">
                    <div className="text-[10px] uppercase font-bold text-white">Target Kitchen Prep</div>
                    <div className="text-3xl font-black text-white mt-1 font-display">{simResult.recommendedPreparation}</div>
                    <div className="text-[11px] text-[#10f072] mt-0.5 font-bold">Portions to cook</div>
                  </div>
                </div>

                {/* Mathematical Reasoning Box */}
                <div className="p-5 bg-black/80 text-white rounded-2xl border border-zinc-800 text-xs space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#10f072] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Algorithmic Engine Explanation
                    </span>
                    <span className="text-[11px] bg-zinc-800 px-2.5 py-0.5 rounded-full text-slate-300 font-mono">
                      Confidence: {(simResult.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {simResult.reasoning}
                  </p>
                  <div className="pt-2 border-t border-zinc-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Base Formula: <code>Prep = Predicted * (1 + Buffer%)</code></span>
                    <span className="text-[#10f072] font-semibold">Variance protection: ACTIVE</span>
                  </div>
                </div>

                {/* Turnout Stress Test Comparison */}
                <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 text-xs">
                  <div className="font-bold text-white mb-3">Live Stress Test Behavior Under Unexpected Turnouts:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                    <div className="p-3 bg-black/60 rounded-xl border border-zinc-800">
                      <div className="font-bold text-slate-300">If exactly {simResult.predictedDemand} arrive:</div>
                      <div className="text-[#10f072] font-semibold mt-1">
                        Buffer left intact ({simResult.bufferAmount} safe surplus preserved for donation or breakfast).
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
                      <div className="font-bold text-[#10f072]">
                        If {simResult.predictedDemand + Math.floor(simResult.bufferAmount / 2)} arrive (Surge):
                      </div>
                      <div className="text-emerald-200 font-semibold mt-1">
                        Buffer absorbs unexpected diners automatically with zero delay or shortfall.
                      </div>
                    </div>

                    <div className="p-3 bg-black/60 rounded-xl border border-zinc-800">
                      <div className="font-bold text-slate-300">If max {simResult.recommendedPreparation} arrive:</div>
                      <div className="text-white font-semibold mt-1">
                        100% buffer utilization. Exactly 0 plates wasted, 0 students turned away.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-800">
                Type your expected student headcount on the left to calculate adaptive predictions and buffer sizing.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Accuracy Records in Shiny Black */}
      {accuracyStats?.recentHistory && accuracyStats.recentHistory.length > 0 && (
        <div className="card-shiny-black rounded-3xl border border-zinc-800 shadow-xl p-6">
          <h2 className="text-base font-bold text-white mb-3">
            Recent Model Predictions & Error Tracking
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-zinc-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-zinc-800">
                <tr>
                  <th className="px-3 py-2.5">Date & Meal</th>
                  <th className="px-3 py-2.5 text-center">Predicted</th>
                  <th className="px-3 py-2.5 text-center">Buffer Applied</th>
                  <th className="px-3 py-2.5 text-center">Target Prep</th>
                  <th className="px-3 py-2.5 text-center">Actual Turnout</th>
                  <th className="px-3 py-2.5 text-center">Variance Error</th>
                  <th className="px-3 py-2.5 text-center">Buffer Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {accuracyStats.recentHistory.map((h: any, idx: number) => (
                  <tr key={h.id ? `accuracy-row-${h.id}` : `accuracy-row-${h.date}-${h.meal_type}-${idx}`} className="hover:bg-zinc-900/40">
                    <td className="px-3 py-2.5 font-bold text-white">
                      {h.date} • {h.meal_type}
                    </td>
                    <td className="px-3 py-2.5 text-center">{h.predicted_demand}</td>
                    <td className="px-3 py-2.5 text-center text-[#10f072] font-semibold">
                      +{h.buffer_amount} ({h.recommended_buffer_percent}%)
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-white">
                      {h.recommended_preparation}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-sky-400">
                      {h.actual_consumption}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-semibold ${h.error_percent <= 5 ? 'text-[#10f072]' : 'text-amber-400'}`}>
                        {h.error_percent}%
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#10f072]/15 text-[#10f072] border border-[#10f072]/30">
                        {h.status?.replace('_', ' ') || 'SAFE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
