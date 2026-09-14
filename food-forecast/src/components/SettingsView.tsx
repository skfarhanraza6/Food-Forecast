import React, { useState, useEffect } from 'react';
import {
  Sliders,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cpu,
  Save,
  RotateCcw,
} from 'lucide-react';
import { BufferConfig } from '../types';
import { api } from '../api';

export const SettingsView: React.FC = () => {
  const [configs, setConfigs] = useState<BufferConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingType, setSavingType] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  // Database reset state
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const res = await api.getBufferConfigs();
      setConfigs(res.configs || []);
    } catch (err) {
      console.error('Error loading buffer configs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleUpdate = async (cfg: BufferConfig) => {
    try {
      setSavingType(cfg.meal_type);
      await api.updateBufferConfig(cfg.meal_type, {
        base_buffer_percent: Number(cfg.base_buffer_percent),
        min_buffer_percent: Number(cfg.min_buffer_percent),
        max_buffer_percent: Number(cfg.max_buffer_percent),
        auto_adjust_enabled: cfg.auto_adjust_enabled ? 1 : 0,
      });
      setSavedSuccess(cfg.meal_type);
      setTimeout(() => setSavedSuccess(null), 3000);
    } catch (err: any) {
      alert('Failed to update config: ' + err.message);
    } finally {
      setSavingType(null);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset the database and re-seed clean demo data?')) return;
    try {
      setIsResetting(true);
      await api.resetDatabase();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 4000);
      loadConfigs();
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div id="settings-view" className="space-y-6 pb-16 max-w-4xl mx-auto text-slate-100">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
          Dynamic Buffer Thresholds & System Controls
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure adaptive safety buffer ranges per meal service and calibrate algorithmic variance tolerances.
        </p>
      </div>

      {/* Safety Buffer Tuning Cards in Shiny Black */}
      <div className="card-shiny-black rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-black border border-[#10f072]/40 text-[#10f072]">
                <ShieldCheck className="w-4 h-4" />
              </span>
              Per-Meal Buffer Configuration
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              The engine automatically scales between min and max buffer % based on recent turnout volatility.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading configurations...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configs.map((cfg, idx) => (
              <div key={cfg.meal_type} className="p-4 rounded-2xl border border-zinc-800 bg-black/60 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{cfg.meal_type}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(cfg.auto_adjust_enabled)}
                      onChange={(e) => {
                        const updated = [...configs];
                        updated[idx].auto_adjust_enabled = e.target.checked ? 1 : 0;
                        setConfigs(updated);
                      }}
                      className="rounded-xs accent-[#10f072] cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-slate-300">Auto-Calibrate</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-medium text-slate-400 block mb-1 text-[10px] uppercase">Base Buffer</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        max="20"
                        value={cfg.base_buffer_percent}
                        onChange={(e) => {
                          const updated = [...configs];
                          updated[idx].base_buffer_percent = Number(e.target.value);
                          setConfigs(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 font-bold text-white focus:outline-hidden focus:border-[#10f072]"
                      />
                      <span className="ml-1 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-slate-400 block mb-1 text-[10px] uppercase">Min Buffer</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="10"
                        value={cfg.min_buffer_percent}
                        onChange={(e) => {
                          const updated = [...configs];
                          updated[idx].min_buffer_percent = Number(e.target.value);
                          setConfigs(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 font-bold text-white focus:outline-hidden focus:border-[#10f072]"
                      />
                      <span className="ml-1 text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-medium text-slate-400 block mb-1 text-[10px] uppercase">Max Buffer</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        step="0.5"
                        min="5"
                        max="25"
                        value={cfg.max_buffer_percent}
                        onChange={(e) => {
                          const updated = [...configs];
                          updated[idx].max_buffer_percent = Number(e.target.value);
                          setConfigs(updated);
                        }}
                        className="w-full px-2 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 font-bold text-white focus:outline-hidden focus:border-[#10f072]"
                      />
                      <span className="ml-1 text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {savedSuccess === cfg.meal_type ? (
                    <span className="text-[11px] font-bold text-[#10f072] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Range: {cfg.min_buffer_percent}% - {cfg.max_buffer_percent}%</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleUpdate(cfg)}
                    disabled={savingType === cfg.meal_type}
                    className="btn-bubble-green px-3 py-1.5 rounded-full text-[11px] font-black transition-all flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>{savingType === cfg.meal_type ? 'Saving...' : 'Update'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Reset Data in Shiny Black */}
      <div className="card-shiny-black rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-black border border-amber-500/40 text-amber-400">
                <Database className="w-4 h-4" />
              </span>
              Demo Data Reset & Factory Calibration
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Judges & evaluators can restore clean, realistic multi-day mess records at any time.
            </p>
          </div>
        </div>

        <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-white">Re-seed All Tables to Clean Initial State</div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Refreshes 16 past and upcoming meals, demo accounts, attendance variance records, student RSVPs, and feedback.
            </div>
          </div>

          <button
            id="reset-database-btn"
            type="button"
            onClick={handleResetData}
            disabled={isResetting}
            className="px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Re-seeding...' : 'Reset & Re-seed DB'}</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-[#10f072] text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10f072]" />
            <span>Database successfully refreshed with initial demo datasets!</span>
          </div>
        )}
      </div>

      {/* System Architecture Specifications */}
      <div className="card-shiny-black border border-zinc-800 rounded-3xl p-6 sm:p-7 text-xs space-y-3">
        <div className="flex items-center gap-2 text-[#10f072] font-bold text-sm">
          <Cpu className="w-4 h-4" />
          Technical Stack & Architectural Guarantee
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
          <div className="p-3 bg-black/60 border border-zinc-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-bold">DATABASE</span>
            <span className="font-black text-white">Persistent SQLite</span>
          </div>
          <div className="p-3 bg-black/60 border border-zinc-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-bold">BACKEND</span>
            <span className="font-black text-white">Express API Router</span>
          </div>
          <div className="p-3 bg-black/60 border border-zinc-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-bold">AUTH</span>
            <span className="font-black text-white">JWT + Bcrypt RBAC</span>
          </div>
          <div className="p-3 bg-black/60 border border-zinc-800 rounded-2xl">
            <span className="text-[10px] text-slate-400 block font-bold">AI / ANALYTICS</span>
            <span className="font-black text-[#10f072]">Adaptive Variance Buffer</span>
          </div>
        </div>
      </div>
    </div>
  );
};
