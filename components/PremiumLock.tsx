import React from 'react';
import { motion } from 'framer-motion';
import { Crown, LogOut, Zap, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const PremiumLock: React.FC = () => {
    const { logout } = useAuth();
    const { accent } = useTheme();

    const handleUpgrade = () => {
        // Placeholder for payment integration
        alert("Redirecting to payment gateway...");
        // In a real app, this would redirect to Stripe/LemonSqueezy checkout
        // window.location.href = 'https://buy.stripe.com/...';
    };

    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-amber-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-red-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-amber-500/20 rounded-3xl p-8 text-center shadow-2xl shadow-amber-500/10"
            >
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                    <Crown size={40} className="text-white" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                    EkagraZone Premium Required
                </h1>
                
                <p className="text-slate-400 leading-relaxed mb-8">
                    Unlock cloud sync, leaderboards, and a distraction-free experience.
                </p>

                <div className="space-y-3">
                    <button 
                        onClick={handleUpgrade}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Zap size={18} className="fill-white" />
                        Upgrade Now
                    </button>

                    <button 
                        onClick={() => logout()}
                        className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold border border-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <ShieldAlert size={12} />
                        ACCESS RESTRICTED
                    </div>
                    
                    <button 
                        onClick={() => {
                            // Set guest mode flag first so it persists after logout
                            localStorage.setItem('ekagrazone_guest_mode', 'true');
                            logout();
                        }}
                        className="font-hand text-2xl text-slate-400 hover:text-cyan-300 transition-colors relative group py-2"
                    >
                        Continue as Guest
                        <span className="absolute bottom-1 left-0 w-0 h-0.5 bg-cyan-300/50 transition-all duration-300 group-hover:w-full"></span>
                    </button>
                </div>

            </motion.div>
        </div>
    );
};
