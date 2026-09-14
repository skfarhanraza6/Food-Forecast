import React, { useState } from 'react';
import { Shield, Key, Mail, Lock, CheckCircle2, AlertCircle, User, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface LoginViewProps {
  onSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'signin' | 'register'>('signin');

  // Sign In inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register inputs
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('STAFF');
  const [regHostel, setRegHostel] = useState('Campus Mess Block A');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email.trim(), password);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Please fill in your name, email, and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register(regName.trim(), regEmail.trim(), regPassword, regRole, regHostel.trim());
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-view-container" className="max-w-xl mx-auto py-10 px-4 sm:px-6 text-slate-100">
      <div className="card-shiny-black rounded-3xl border border-zinc-800 shadow-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-white border border-[#10f072]/50 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(16,240,114,0.3)]">
            <img src="/logo-icon.png" alt="Food Forecast logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">FOOD FORECAST Account</h1>
            <p className="text-xs text-slate-400">Sign in with your credentials or register a new campus mess profile</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-black/70 border border-zinc-800 p-1.5 rounded-full mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('signin');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-full text-xs font-black transition-all ${
              tab === 'signin'
                ? 'bg-zinc-800 text-[#10f072] border border-[#10f072]/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-full text-xs font-black transition-all ${
              tab === 'register'
                ? 'bg-zinc-800 text-[#10f072] border border-[#10f072]/30 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create New Account
          </button>
        </div>

        {error && (
          <div id="login-error-alert" className="mb-5 p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {tab === 'signin' ? (
          <form id="login-form" onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-300 mb-1.5">
                Campus Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-sm focus:outline-hidden focus:border-[#10f072] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-bold text-[#10f072] hover:underline focus:outline-hidden"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password..."
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-sm focus:outline-hidden focus:border-[#10f072] transition-all"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-bubble-green w-full mt-2 py-3 px-4 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,240,114,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating with server...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form id="register-form" onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="reg-name"
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Enter your full name..."
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-sm focus:outline-hidden focus:border-[#10f072] transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Enter your email address..."
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-sm focus:outline-hidden focus:border-[#10f072] transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  id="reg-password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create a password..."
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-sm focus:outline-hidden focus:border-[#10f072] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-role" className="block text-xs font-bold text-slate-300 mb-1.5">
                  Role
                </label>
                <select
                  id="reg-role"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-sm font-bold focus:outline-hidden focus:border-[#10f072]"
                >
                  <option value="STAFF" className="bg-zinc-900">Kitchen Staff</option>
                  <option value="ADMIN" className="bg-zinc-900">Mess Administrator</option>
                  <option value="STUDENT" className="bg-zinc-900">Student</option>
                </select>
              </div>

              <div>
                <label htmlFor="reg-hostel" className="block text-xs font-bold text-slate-300 mb-1.5">
                  Hostel / Block
                </label>
                <input
                  id="reg-hostel"
                  type="text"
                  value={regHostel}
                  onChange={(e) => setRegHostel(e.target.value)}
                  placeholder="Enter hostel/mess block..."
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-white text-sm focus:outline-hidden focus:border-[#10f072]"
                />
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-bubble-green w-full mt-2 py-3 px-4 rounded-full text-xs font-black shadow-[0_0_15px_rgba(16,240,114,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Creating account...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
