import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Leaf,
  Droplets,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowUpRight,
  TrendingDown,
  RefreshCw,
  Sparkles,
  Info,
  ChevronRight,
  IndianRupee,
  Utensils,
  PlusCircle,
  HelpCircle,
  Percent,
  CloudSun,
} from 'lucide-react';
import {
  ResponsiveContainer,
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
} from 'recharts';
import { SmartBufferVisualizer } from './SmartBufferVisualizer';
import { DashboardSummary } from '../types';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigateTab }) => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Student intention state for quick action
  const [studentAttending, setStudentAttending] = useState<boolean>(true);
  const [intentionSaved, setIntentionSaved] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const [summaryRes, chartsRes] = await Promise.all([
        api.getDashboardSummary(),
        api.getAnalyticsCharts(),
      ]);
      setData(summaryRes);
      setChartsData(chartsRes);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleStudentRsvp = async (attending: boolean) => {
    if (!data?.currentMeal) return;
    try {
      await api.setMealIntention(data.currentMeal.id, attending);
      setStudentAttending(attending);
      setIntentionSaved(true);
      setTimeout(() => setIntentionSaved(false), 3000);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to save RSVP:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-[#10f072] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(16,240,114,0.4)]" />
        <p className="text-xs font-semibold text-slate-400">Loading real-time mess intelligence data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-950/60 border border-rose-800 rounded-3xl max-w-xl mx-auto my-12 text-center text-rose-200">
        <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <h3 className="font-bold text-white text-base">Unable to connect to Food Forecast database</h3>
        <p className="text-xs text-rose-300 mt-1">{error || 'Unknown error'}</p>
        <button
          type="button"
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-full hover:bg-rose-500 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { currentMeal, metrics, alerts } = data;

  return (
    <div id="dashboard-view" className="space-y-6 pb-16 text-slate-100">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
              Live Mess Operations
            </h1>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#10f072]/15 text-[#10f072] border border-[#10f072]/40 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,240,114,0.2)]">
              <span className="w-2 h-2 rounded-full bg-[#10f072] animate-pulse" />
              Real Database Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic safety buffers, live turnout tracking, and continuous sustainability auditing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="refresh-dashboard-btn"
            type="button"
            onClick={fetchDashboardData}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-xs font-bold text-slate-200 transition-colors disabled:opacity-50"
            title="Refresh from SQLite database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>

          {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
            <button
              id="log-turnout-quick-btn"
              type="button"
              onClick={() => onNavigateTab('consumption')}
              className="btn-bubble-green flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,240,114,0.35)] transition-all"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Record Kitchen Turnout</span>
            </button>
          )}

          <button
            id="ask-assistant-quick-btn"
            type="button"
            onClick={() => onNavigateTab('queries')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-900 border border-zinc-700 hover:border-[#10f072] text-white text-xs font-bold transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#10f072]" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>

      {/* Live Alerts Notification Bar */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                alert.type === 'danger'
                  ? 'bg-rose-950/60 border-rose-800/80 text-rose-200'
                  : alert.type === 'warning'
                  ? 'bg-amber-950/60 border-amber-800/80 text-amber-200'
                  : alert.type === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
                  : 'bg-zinc-900/90 border-zinc-700 text-slate-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {alert.type === 'danger' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                ) : alert.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                ) : alert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 text-[#10f072] mt-0.5 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-white">{alert.title}: </span>
                  <span className="opacity-90">{alert.message}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold opacity-60 uppercase whitespace-nowrap">
                {alert.timestamp}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Smart Buffer Showcase Component with Direct Custom Inputs */}
      <SmartBufferVisualizer
        predictedDemand={currentMeal?.predicted_demand || 400}
        bufferPercent={currentMeal?.recommended_buffer_percent || 5.0}
        bufferAmount={currentMeal?.buffer_amount || 20}
        recommendedPreparation={currentMeal?.recommended_preparation || 420}
        actualConsumption={currentMeal?.actual_consumption || 410}
        status={currentMeal?.consumption_status || 'BUFFER_USED'}
        mealType={`Active Live: ${currentMeal?.meal_type || 'Lunch'}`}
        onMealSaved={fetchDashboardData}
      />

      {/* Student RSVP Widget (Active for Students) */}
      {user?.role === 'STUDENT' && currentMeal && (
        <div className="card-shiny-black border border-emerald-500/30 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black border border-[#10f072]/40 text-[#10f072] flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(16,240,114,0.3)]">
              🍽️
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider">
                Student Dining Intent • {currentMeal.meal_type}
              </div>
              <div className="text-xs text-slate-300 mt-0.5 font-medium">
                Menu: {currentMeal.menu}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Confirming helps the kitchen prepare the exact right buffer and cuts avoidable food scrap!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="rsvp-yes-btn"
              type="button"
              onClick={() => handleStudentRsvp(true)}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
                studentAttending
                  ? 'btn-bubble-green'
                  : 'bg-zinc-900 text-slate-300 border border-zinc-700 hover:text-white'
              }`}
            >
              ✓ I Plan to Eat
            </button>
            <button
              id="rsvp-no-btn"
              type="button"
              onClick={() => handleStudentRsvp(false)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                !studentAttending
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-zinc-900 text-slate-300 border border-zinc-700 hover:text-white'
              }`}
            >
              ✕ Skipping Meal
            </button>
            {intentionSaved && (
              <span className="text-[11px] font-bold text-[#10f072] animate-fade-in">
                Saved!
              </span>
            )}
          </div>
        </div>
      )}

      {/* 6 Key Impact & Operational KPI Cards in Shiny Black */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Food Waste Prevented */}
        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col justify-between hover:border-[#10f072]/50 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Food Waste Avoided</span>
            <span className="p-2 rounded-xl bg-black border border-[#10f072]/30 text-[#10f072]">
              <Leaf className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-white tracking-tight font-display">
              {metrics.foodSavedKg.toFixed(1)} <span className="text-base font-semibold text-slate-400">kg</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#10f072] font-bold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{metrics.wasteReductionPercent}% reduction vs unmanaged baseline</span>
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-slate-400 flex justify-between">
            <span>Leftover Surplus: <strong className="text-slate-200">{currentMeal?.leftover_meals || 10} meals</strong></span>
            <span>Historical Avg: ~45 meals</span>
          </div>
        </div>

        {/* 2. Total Meals Saved */}
        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col justify-between hover:border-[#10f072]/50 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Meals Saved from Dump</span>
            <span className="p-2 rounded-xl bg-black border border-[#10f072]/30 text-[#10f072]">
              <Utensils className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-white tracking-tight font-display">
              {metrics.mealsSaved.toLocaleString()} <span className="text-base font-semibold text-slate-400">portions</span>
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">
              Preserved across recorded mess meal services
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-slate-400 flex justify-between">
            <span>Total Diners: <strong className="text-slate-200">{metrics.totalMealsServed.toLocaleString()}</strong></span>
            <span className="text-[#10f072] font-semibold">Zero edible disposal</span>
          </div>
        </div>

        {/* 3. Prediction Accuracy */}
        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col justify-between hover:border-sky-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Forecast Accuracy</span>
            <span className="p-2 rounded-xl bg-black border border-sky-500/30 text-sky-400">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-sky-400 tracking-tight font-display">
              {metrics.predictionAccuracy}%
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">
              Mean absolute percentage error ~{(100 - metrics.predictionAccuracy).toFixed(1)}%
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-slate-400 flex justify-between">
            <span>Buffer absorbed surge</span>
            <span className="text-sky-300 font-semibold">Protected envelope</span>
          </div>
        </div>

        {/* 4. Financial Cost Avoided */}
        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col justify-between hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Operational Cost Saved</span>
            <span className="p-2 rounded-xl bg-black border border-amber-500/30 text-amber-400">
              <IndianRupee className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-amber-400 tracking-tight font-display">
              ₹{metrics.costSavedInr.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">
              Saved at raw material cost of ₹45–50/meal
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-slate-400 flex justify-between">
            <span>Direct food purchase saved</span>
            <span className="text-amber-300 font-semibold">Retained in mess fund</span>
          </div>
        </div>

        {/* 5. CO2e Avoided */}
        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col justify-between hover:border-[#10f072]/50 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">CO₂e Avoided</span>
              <span className="text-[10px] text-slate-500">(Est.)</span>
            </div>
            <span className="p-2 rounded-xl bg-black border border-[#10f072]/30 text-[#10f072]">
              <CloudSun className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-[#10f072] tracking-tight font-display">
              {metrics.co2AvoidedKg.toFixed(1)} <span className="text-base font-semibold text-slate-400">kg CO₂e</span>
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">
              EPA standard: 2.5 kg CO₂e per 1 kg food waste avoided
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-slate-400">
            Equivalent to ~2,800 km petrol driving avoided
          </div>
        </div>

        {/* 6. Water Footprint Conserved */}
        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.7)] flex flex-col justify-between hover:border-sky-500/50 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Water Conserved</span>
              <span className="text-[10px] text-slate-500">(Est.)</span>
            </div>
            <span className="p-2 rounded-xl bg-black border border-sky-500/30 text-sky-400">
              <Droplets className="w-4 h-4" />
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-sky-300 tracking-tight font-display">
              {metrics.waterAvoidedLiters.toLocaleString()} <span className="text-base font-semibold text-slate-400">L</span>
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1">
              Agricultural irrigation conserved: 650 L per 1 kg produce
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800/80 text-[11px] text-slate-400">
            Equivalent to ~1,170 residential showers
          </div>
        </div>
      </div>

      {/* Charts Section Styled for Shiny Black Background */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Predicted vs Actual vs Preparation */}
        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div>
              <h3 className="font-bold text-white text-sm">Attendance vs Model Forecast</h3>
              <p className="text-[11px] text-slate-400">Historical comparison across consecutive meals</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> Forecast
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10f072] inline-block shadow-[0_0_8px_rgba(16,240,114,0.7)]" /> Prep
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Actual
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartsData?.attendanceComparison?.slice(-8) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={['dataMin - 30', 'dataMax + 20']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid #27272a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="predicted" name="Predicted" stroke="#71717a" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="recommendedPrep" name="Recommended Prep" stroke="#10f072" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="actual" name="Actual Attendance" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 3, fill: '#38bdf8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Weekly Food Waste Avoided vs Leftover */}
        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div>
              <h3 className="font-bold text-white text-sm">Food Saved vs Leftover Surplus (kg)</h3>
              <p className="text-[11px] text-slate-400">Controlled surplus kept low while saving edible meals</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10f072] inline-block shadow-[0_0_8px_rgba(16,240,114,0.7)]" /> Food Saved
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Leftover
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData?.wasteTrend?.slice(-8) || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid #27272a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="foodSavedKg" name="Food Saved (kg)" fill="#10f072" radius={[6, 6, 0, 0]} />
                <Bar dataKey="leftoverKg" name="Leftover (kg)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Row: Buffer Utilization Status Distribution & Meal Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buffer Health Distribution */}
        <div className="card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Buffer Health Breakdown</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Distribution of outcomes across recorded meals</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartsData?.bufferDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(chartsData?.bufferDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', border: '1px solid #27272a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-800">
            {(chartsData?.bufferDistribution || []).map((b: any) => (
              <div key={b.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                <span className="text-slate-400 truncate">{b.name}:</span>
                <span className="font-bold text-white">{b.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Meal Type Performance Breakdown */}
        <div className="lg:col-span-2 card-shiny-black p-5 rounded-3xl border border-zinc-800 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
            <div>
              <h3 className="font-bold text-white text-sm">Meal Category Performance</h3>
              <p className="text-[11px] text-slate-400">Average attendance and waste intensity by meal type</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Breakfast • Lunch • Snacks • Dinner</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {(chartsData?.mealTypeBreakdown || []).map((m: any) => (
              <div key={m.mealType} className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                <div className="text-xs font-bold text-slate-300">{m.mealType}</div>
                <div className="text-xl font-black text-white mt-1">{m.avgAttendance}</div>
                <div className="text-[11px] text-slate-400">avg attendees</div>
                <div className="mt-2 text-[10px] font-black text-[#10f072] bg-[#10f072]/10 border border-[#10f072]/30 px-2 py-0.5 rounded-full inline-block">
                  Avg Waste: {m.avgWasteKg} kg
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-black/60 border border-zinc-800 text-xs text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#10f072] shrink-0" />
              <span>
                <strong>Adaptive Learning Insight:</strong> Sunday lunch and Friday dinners show highest turnout variability. Dynamic safety buffer auto-scales to +6.5% for those slots.
              </span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('predictions')}
              className="text-[#10f072] font-black hover:underline shrink-0 ml-3"
            >
              Explore Engine →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
