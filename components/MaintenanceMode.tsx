
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, LogOut, Construction } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const MaintenanceMode: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const { accent } = useTheme();

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-900/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-900/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-md w-full bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center shadow-2xl"
      >
        {/* Logo Animation */}
        <div className="flex justify-center mb-8">
            <div className="relative">
                <div className={`absolute inset-0 bg-${accent}-500 blur-2xl opacity-20 rounded-full animate-pulse`} />
                <img 
                    src="https://i.ibb.co/kgHZ72z1/EKAGRAZONE-LOGO-removebg-preview.png" 
                    alt="EkagraZone Logo" 
                    className="relative w-20 h-20 rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-3 -right-3 bg-slate-900 border border-white/10 p-2 rounded-full text-amber-400">
                    <Construction size={16} />
                </div>
            </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          Private Beta in Progress
        </h1>
        
        <div className="flex items-center justify-center gap-2 mb-6">
            <Shield size={14} className="text-emerald-400" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">Access Restricted</span>
        </div>

        <p className="text-slate-400 leading-relaxed mb-8">
          We are currently fine-tuning the zone for a global launch. Stay tuned for the <span className="text-white font-bold">Arena</span> and <span className="text-white font-bold">Leaderboard</span> updates!
        </p>

        {currentUser && (
            <div className="bg-white/5 rounded-xl p-3 mb-8 border border-white/5">
                <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Logged in as</p>
                <p className="text-sm text-slate-300 font-mono truncate">{currentUser.email}</p>
            </div>
        )}

        <button 
            onClick={() => logout()}
            className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-2 group"
        >
            <LogOut size={18} className="text-slate-400 group-hover:text-white transition-colors" />
            Sign Out
        </button>

      </motion.div>

      <div className="absolute bottom-8 text-center">
          <p className="text-[10px] text-slate-600 font-mono tracking-widest">EKAGRAZONE SYSTEM</p>
      </div>
    </div>
  );
};
