import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles,
  Leaf,
  Droplets,
  IndianRupee,
  CloudSun,
} from 'lucide-react';
import { api } from '../api';

export const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCharts() {
      try {
        const res = await api.getAnalyticsCharts();
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCharts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-xs text-slate-400 font-semibold">
        Loading analytics charts...
      </div>
    );
  }

  return (
    <div id="analytics-view" className="space-y-6 pb-16 text-slate-100">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Deep Operational & Sustainability Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Longitudinal trend analyses of attendance predictability, dynamic buffer sizing, and cost avoidance.
        </p>
      </div>

      {/* Chart 1: Attendance vs Forecast vs Preparation */}
      <div className="card-shiny-black p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-800 mb-4 gap-2">
          <div>
            <h3 className="font-bold text-white text-sm">Attendance vs Dynamic Preparation Timeline</h3>
            <p className="text-[11px] text-slate-400">Demonstrating safety buffer absorption of attendance fluctuations</p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Forecast</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10f072] shadow-[0_0_8px_rgba(16,240,114,0.6)]" /> Prep w/ Buffer</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Actual Headcount</span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.attendanceComparison || []}>
              <defs>
                <linearGradient id="colorPrep" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10f072" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10f072" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={['dataMin - 30', 'dataMax + 20']} />
              <Tooltip
                contentStyle={{ backgroundColor: '#090d16', border: '1px solid #27272a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
              />
              <Area type="monotone" dataKey="recommendedPrep" name="Prep w/ Buffer" stroke="#10f072" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrep)" />
              <Line type="monotone" dataKey="predicted" name="Base Forecast" stroke="#71717a" strokeDasharray="3 3" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="actual" name="Actual Attendance" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3, fill: '#38bdf8' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Cumulative Waste Avoided & Budget Savings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-shiny-black p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="pb-3 border-b border-zinc-800 mb-4">
            <h3 className="font-bold text-white text-sm">Food Waste Avoided per Meal (kg)</h3>
            <p className="text-[11px] text-slate-400">Substantial reduction achieved vs unmanaged preparation</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.wasteTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid #27272a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="foodSavedKg" name="Food Saved (kg)" fill="#10f072" radius={[6, 6, 0, 0]} />
                <Bar dataKey="leftoverKg" name="Surplus Leftover (kg)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Savings Timeline */}
        <div className="card-shiny-black p-5 sm:p-6 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="pb-3 border-b border-zinc-800 mb-4">
            <h3 className="font-bold text-white text-sm">Mess Budget Retained per Meal (₹ INR)</h3>
            <p className="text-[11px] text-slate-400">Direct financial savings retained in student mess accounts</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.wasteTrend || []}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid #27272a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="costSaved" name="Cost Saved (₹)" stroke="#fbbf24" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
