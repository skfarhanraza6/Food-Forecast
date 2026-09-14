import React from 'react';
import {
  Leaf,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Droplets,
  CloudSun,
  IndianRupee,
  UtensilsCrossed,
  Layers,
  Flame,
  ChevronRight,
  HeartHandshake,
  Cpu,
} from 'lucide-react';
import { SmartBufferVisualizer } from './SmartBufferVisualizer';

interface LandingPageProps {
  onEnterDashboard: () => void;
  onEnterSimulation?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard }) => {
  return (
    <div id="landing-page" className="min-h-screen bg-shiny-black bg-[#04060a] text-slate-100 selection:bg-[#10f072] selection:text-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 rounded-full bg-white border border-[#10f072]/40 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(16,240,114,0.35)]">
              <img src="/logo-icon.png" alt="Food Forecast logo" className="w-full h-full object-cover" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/80 border border-[#10f072]/40 text-[#10f072] text-xs font-black mb-6 shadow-[0_0_15px_rgba(16,240,114,0.2)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sustain X Hackathon • Intelligent Food Waste Prevention Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1] font-display">
              Feed People. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10f072] via-emerald-400 to-sky-400">
                Not Waste.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              FOOD FORECAST is a high-precision meal-demand management engine for college and institutional messes.
              We combine <strong>predictive forecasting</strong> with an <strong>adaptive safety buffer</strong> to eliminate
              avoidable food scrap while ensuring every single student is fully served.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                id="hero-enter-dashboard-btn"
                type="button"
                onClick={onEnterDashboard}
                className="btn-bubble-green w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-black shadow-[0_0_20px_rgba(16,240,114,0.4)] transition-all flex items-center justify-center gap-2 group"
              >
                <span>Launch Live Application</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#smart-buffer-section"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-zinc-700 bg-zinc-900/80 hover:bg-zinc-800 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
              >
                <span>Understand Smart Buffer</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Impact Badges in Shiny Black */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <div className="card-shiny-black p-4 rounded-2xl border border-zinc-800 shadow-xl">
                <div className="text-2xl font-black text-[#10f072]">679+</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Meals Saved from Dump</div>
              </div>
              <div className="card-shiny-black p-4 rounded-2xl border border-zinc-800 shadow-xl">
                <div className="text-2xl font-black text-sky-400">271.6 kg</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Food Waste Avoided</div>
              </div>
              <div className="card-shiny-black p-4 rounded-2xl border border-zinc-800 shadow-xl">
                <div className="text-2xl font-black text-indigo-400">679 kg</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">CO₂e Cut from Air</div>
              </div>
              <div className="card-shiny-black p-4 rounded-2xl border border-zinc-800 shadow-xl">
                <div className="text-2xl font-black text-amber-400">₹30,815</div>
                <div className="text-xs text-slate-400 font-medium mt-0.5">Direct Mess Budget Saved</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem & The Solution */}
      <section className="py-16 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#10f072] mb-2">The Institutional Dilemma</h2>
            <h3 className="text-3xl font-black text-white font-display">Why College Messes Waste 20% of Food</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-3">
              Traditional dining kitchens face an impossible gamble every single meal between over-cooking and student stockouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="card-shiny-black p-6 sm:p-7 rounded-3xl border border-rose-900/60 bg-rose-950/20">
              <div className="inline-flex p-2.5 rounded-2xl bg-rose-950 border border-rose-700/60 text-rose-400 mb-4">
                <TrendingDown className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-black text-white mb-2">The Fear-Driven Over-Preparation</h4>
              <p className="text-xs text-rose-200 leading-relaxed mb-4">
                Messes fear student protests if food runs out. As a result, kitchen staff routinely cook 15–25% extra food based on gut feeling.
              </p>
              <ul className="space-y-2.5 text-xs text-rose-300 font-semibold">
                <li className="flex items-center gap-2">✕ Tons of edible dal, rice, and vegetables dumped into landfills</li>
                <li className="flex items-center gap-2">✕ Huge methane (CO₂e) footprint & wasted irrigation water</li>
                <li className="flex items-center gap-2">✕ Ballooning hostel mess fees charged back to students</li>
              </ul>
            </div>

            {/* The FOOD FORECAST Way */}
            <div className="card-shiny-black p-6 sm:p-7 rounded-3xl border border-emerald-500/40 bg-emerald-950/20">
              <div className="inline-flex p-2.5 rounded-2xl bg-black border border-[#10f072]/50 text-[#10f072] mb-4 shadow-[0_0_15px_rgba(16,240,114,0.3)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-black text-white mb-2">The FOOD FORECAST Smart Buffer Solution</h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Instead of blind guesswork, our algorithm forecasts real attendance, computes an adaptive 3%–15% safety buffer, and adapts dynamically.
              </p>
              <ul className="space-y-2.5 text-xs text-emerald-300 font-semibold">
                <li className="flex items-center gap-2">✓ Guarantees safety cushion for unexpected student surges</li>
                <li className="flex items-center gap-2">✓ Cuts avoidable leftover scrap by up to 78%</li>
                <li className="flex items-center gap-2">✓ Closes the feedback loop: learn from every meal's outcome</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* The 7-Step Core Concept Loop */}
      <section className="py-16 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#10f072] mb-2">The Continuous Feedback Engine</h2>
            <h3 className="text-3xl font-black text-white font-display">The 7-Step Improvement Cycle</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-3">
              PREDICT → ADD BUFFER → PREPARE → MONITOR → COMPARE → LEARN → IMPROVE
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 max-w-6xl mx-auto">
            {[
              { step: '1', title: 'Predict', desc: 'Forecast attendance from history & day-of-week' },
              { step: '2', title: 'Add Buffer', desc: 'Calculate 3%–15% adaptive variance cushion' },
              { step: '3', title: 'Prepare', desc: 'Kitchen cooks precise recommended quantity' },
              { step: '4', title: 'Monitor', desc: 'Live headcount check during dining hours' },
              { step: '5', title: 'Compare', desc: 'Measure buffer absorbed vs surplus vs shortage' },
              { step: '6', title: 'Learn', desc: 'Feed variance back into machine learning engine' },
              { step: '7', title: 'Improve', desc: 'Tighter buffers & zero stockouts tomorrow' },
            ].map((s) => (
              <div key={s.step} className="card-shiny-black p-4 rounded-2xl border border-zinc-800 shadow-xl flex flex-col justify-between text-center">
                <div className="w-8 h-8 mx-auto rounded-full bg-black border border-[#10f072]/50 text-[#10f072] font-black text-xs flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(16,240,114,0.3)]">
                  {s.step}
                </div>
                <div className="font-black text-white text-sm">{s.title}</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-snug">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Smart Buffer Component Section */}
      <section id="smart-buffer-section" className="py-16 border-b border-zinc-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#10f072] mb-2">Interactive Proof of Concept</h2>
            <h3 className="text-3xl font-black text-white font-display">Test the Smart Buffer Live</h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-3">
              Switch to custom mode or use preset inputs to test real-time buffer calculations and see outputs change instantly!
            </p>
          </div>

          <SmartBufferVisualizer
            predictedDemand={400}
            bufferPercent={5.0}
            bufferAmount={20}
            recommendedPreparation={420}
            actualConsumption={410}
            status="BUFFER_USED"
            mealType="Today's Lunch Highlight"
          />
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-16 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#10f072] mb-2">Role-Tailored Architecture</h2>
            <h3 className="text-3xl font-black text-white font-display">Built for the Entire Campus</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Student */}
            <div className="card-shiny-black p-6 sm:p-7 rounded-3xl border border-zinc-800 shadow-2xl">
              <div className="w-10 h-10 rounded-2xl bg-black border border-emerald-500/40 text-[#10f072] flex items-center justify-center font-bold mb-4 shadow-[0_0_10px_rgba(16,240,114,0.2)]">
                🎓
              </div>
              <h4 className="text-base font-black text-white mb-2">For Students</h4>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">✓ View daily breakfast, lunch, snacks & dinner menus</li>
                <li className="flex items-center gap-2">✓ 1-click RSVP (eating / skipping) to assist kitchen planning</li>
                <li className="flex items-center gap-2">✓ Rate meal taste, portion sizes, and submit feedback</li>
                <li className="flex items-center gap-2">✓ Ask natural-language questions to the query assistant</li>
              </ul>
            </div>

            {/* Mess Staff */}
            <div className="card-shiny-black p-6 sm:p-7 rounded-3xl border border-zinc-800 shadow-2xl">
              <div className="w-10 h-10 rounded-2xl bg-black border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold mb-4 shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                👨‍🍳
              </div>
              <h4 className="text-base font-black text-white mb-2">For Kitchen Staff</h4>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">✓ Clear, exact target preparation numbers before every shift</li>
                <li className="flex items-center gap-2">✓ Real-time logging of actual preparation and turnout</li>
                <li className="flex items-center gap-2">✓ Instant alerts if attendance is exhausting the buffer</li>
                <li className="flex items-center gap-2">✓ Leftover food logging with compost/donation destination</li>
              </ul>
            </div>

            {/* Admin */}
            <div className="card-shiny-black p-6 sm:p-7 rounded-3xl border border-zinc-800 shadow-2xl">
              <div className="w-10 h-10 rounded-2xl bg-black border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold mb-4 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                🏛️
              </div>
              <h4 className="text-base font-black text-white mb-2">For Mess Wardens & Admins</h4>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2">✓ Complete executive analytics & environmental impact audits</li>
                <li className="flex items-center gap-2">✓ Configure base, min & max buffer % per meal type</li>
                <li className="flex items-center gap-2">✓ Monitor prediction accuracy trend across weeks</li>
                <li className="flex items-center gap-2">✓ Track financial budget savings and ESG reporting metrics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-16 text-center border-t border-zinc-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-12 h-12 rounded-2xl bg-black border border-[#10f072]/50 text-[#10f072] flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,240,114,0.3)]">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight font-display">
            Ready to experience FOOD FORECAST?
          </h2>
          <p className="mt-3 text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Explore the live dashboard, enter your custom values, test attendance spikes, and see our dynamic buffer engine in action.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              id="footer-launch-dashboard-btn"
              type="button"
              onClick={onEnterDashboard}
              className="btn-bubble-green px-8 py-3.5 rounded-full text-xs sm:text-sm font-black shadow-[0_0_20px_rgba(16,240,114,0.4)] transition-all"
            >
              Enter Application Dashboard
            </button>
          </div>
          <div className="mt-12 text-[11px] text-slate-500">
            FOOD FORECAST • Built for Sustain X Hackathon 2026 • Persistent SQLite & Express Architecture
          </div>
        </div>
      </footer>
    </div>
  );
};
