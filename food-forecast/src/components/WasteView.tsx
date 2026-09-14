import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Leaf,
  Droplets,
  CloudSun,
  IndianRupee,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Meal } from '../types';
import { api } from '../api';

export const WasteView: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.getMeals();
        setMeals(res.meals || []);
      } catch (err) {
        console.error('Failed to load waste records:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const completedMeals = meals.filter((m) => m.actual_consumption !== undefined && m.actual_consumption !== null);

  const totalLeftoverKg = completedMeals.reduce((acc, m) => acc + (m.leftover_weight_kg || 0), 0);
  const totalFoodSavedKg = completedMeals.reduce((acc, m) => acc + (m.food_saved_kg || 0), 0);
  const totalCo2Avoided = completedMeals.reduce((acc, m) => acc + (m.co2_avoided_kg || 0), 0);
  const totalWaterSaved = completedMeals.reduce((acc, m) => acc + (m.water_avoided_liters || 0), 0);

  const exportCsv = () => {
    const headers = ['Date', 'MealType', 'Prepared', 'Consumed', 'LeftoverMeals', 'LeftoverKg', 'FoodSavedKg', 'CostSavedINR', 'CO2eAvoidedKg', 'WaterAvoidedL', 'Reason', 'Action'];
    const rows = completedMeals.map((m) => [
      m.date,
      m.meal_type,
      m.actual_preparation || '',
      m.actual_consumption || '',
      m.leftover_meals || 0,
      m.leftover_weight_kg || 0,
      m.food_saved_kg || 0,
      m.cost_saved_inr || 0,
      m.co2_avoided_kg || 0,
      m.water_avoided_liters || 0,
      `"${m.waste_reason || ''}"`,
      `"${m.action_taken || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `food_forecast_waste_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="waste-view" className="space-y-6 pb-16 text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
            Food Waste Prevention & ESG Audit Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditable tracking of food scrap prevented, surplus diversion, and environmental metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="btn-bubble-green flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,240,114,0.35)] transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export ESG CSV Audit</span>
        </button>
      </div>

      {/* Aggregate Cumulative Banner in Shiny Black */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="p-1.5 rounded-xl bg-black border border-[#10f072]/40 text-[#10f072]">
              <Leaf className="w-3.5 h-3.5" />
            </span>
            Food Waste Prevented
          </div>
          <div className="text-3xl font-black text-[#10f072] mt-2 font-display">
            {totalFoodSavedKg.toFixed(1)} <span className="text-xs text-slate-400 font-sans">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Against uncalibrated over-prep baseline
          </div>
        </div>

        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="p-1.5 rounded-xl bg-black border border-sky-500/40 text-sky-400">
              <CloudSun className="w-3.5 h-3.5" />
            </span>
            CO₂e Emissions Cut
          </div>
          <div className="text-3xl font-black text-sky-400 mt-2 font-display">
            {totalCo2Avoided.toFixed(1)} <span className="text-xs text-slate-400 font-sans">kg CO₂e</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            2.5 kg CO₂e per 1 kg food preserved
          </div>
        </div>

        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="p-1.5 rounded-xl bg-black border border-indigo-500/40 text-indigo-400">
              <Droplets className="w-3.5 h-3.5" />
            </span>
            Water Footprint Saved
          </div>
          <div className="text-3xl font-black text-indigo-300 mt-2 font-display">
            {totalWaterSaved.toLocaleString()} <span className="text-xs text-slate-400 font-sans">Liters</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Conserved across irrigation & supply
          </div>
        </div>

        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="p-1.5 rounded-xl bg-black border border-amber-500/40 text-amber-400">
              <Trash2 className="w-3.5 h-3.5" />
            </span>
            Surplus Diverted
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2 font-display">
            {totalLeftoverKg.toFixed(1)} <span className="text-xs text-slate-400 font-sans">kg</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            100% diverted to biogas / compost
          </div>
        </div>
      </div>

      {/* Verified Log Table in Shiny Black */}
      <div className="card-shiny-black rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            Historical Food Service Waste Log ({completedMeals.length} records)
          </h2>
          <span className="text-xs text-[#10f072] font-semibold">Live verified database rows</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-zinc-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3.5">Date & Meal</th>
                <th className="px-4 py-3.5 text-center">Prepared / Eaten</th>
                <th className="px-4 py-3.5 text-center">Surplus Leftover</th>
                <th className="px-4 py-3.5 text-center">Food Saved</th>
                <th className="px-4 py-3.5 text-center">Cost Saved</th>
                <th className="px-4 py-3.5">Waste Cause</th>
                <th className="px-4 py-3.5">Action & Destination</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {completedMeals.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="font-bold text-white">{m.date}</div>
                    <div className="text-[11px] text-slate-400">{m.meal_type}</div>
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap font-medium text-slate-200">
                    {m.actual_preparation} prep / {m.actual_consumption} eaten
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className="font-bold text-white">{m.leftover_meals || 0} meals</span>
                    <span className="text-[11px] text-slate-400 ml-1">({m.leftover_weight_kg || 0} kg)</span>
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap font-black text-[#10f072]">
                    +{m.food_saved_kg || 0} kg
                  </td>

                  <td className="px-4 py-3.5 text-center whitespace-nowrap font-black text-amber-400">
                    ₹{m.cost_saved_inr?.toLocaleString() || 0}
                  </td>

                  <td className="px-4 py-3.5 max-w-xs text-[11px] text-slate-300 truncate" title={m.waste_reason}>
                    {m.waste_reason || 'Normal plate scrap'}
                  </td>

                  <td className="px-4 py-3.5 max-w-xs text-[11px] text-[#10f072] font-semibold truncate" title={m.action_taken}>
                    {m.action_taken || 'Campus biogas diversion'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
