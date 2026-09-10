import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import chokkuLogo from '../assets/img/chokku.png';

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Invalid email or password.');
      return;
    }

    setLoading(true);
    const result = await adminLogin(username.trim(), password);
    setLoading(false);

    if (result.success) {
      navigate('/admin-dashboard');
    } else {
      setErrorMsg(result.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#609f00]/20 via-slate-900/60 to-slate-950 pointer-events-none" />

      <div className="relative max-w-md w-full bg-slate-900/90 rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-800 backdrop-blur-xl space-y-6 animate-fade-in">
        
        {/* Header Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#609f00] to-emerald-400 mx-auto flex items-center justify-center text-white shadow-lg shadow-[#609f00]/30 border border-emerald-300/30">
            <ShieldCheck className="w-8 h-8 stroke-[2.3]" />
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <img src={chokkuLogo} alt="Chokku Store Logo" className="h-9 w-auto object-contain brightness-110" />
            <span className="bg-emerald-500/10 text-emerald-400 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Admin Portal
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Admin Authentication
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Sign in to manage store inventory, orders, and registered accounts.
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Admin Login Form */}
        <form onSubmit={handleAdminLogin} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Admin Username / Email
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username or email"
                className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-slate-950/80 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-[#609f00] focus:ring-2 focus:ring-[#609f00]/20 transition-all placeholder:text-slate-600"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 text-sm font-medium bg-slate-950/80 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-[#609f00] focus:ring-2 focus:ring-[#609f00]/20 transition-all placeholder:text-slate-600"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#609f00] to-emerald-600 hover:from-[#528900] hover:to-emerald-700 text-white font-extrabold py-3.5 px-6 rounded-xl shadow-lg shadow-[#609f00]/20 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating Admin...' : 'Sign In as Admin'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
