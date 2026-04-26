import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Zap, Lock } from 'lucide-react';

interface PremiumLockProps {
    onUpgrade: () => void;
    title?: string;
    description?: string;
}

export const PremiumLock: React.FC<PremiumLockProps> = ({ 
    onUpgrade, 
    title = "Premium Feature", 
    description = "Unlock this feature and many more with a one-time payment for lifetime access." 
}) => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md rounded-inherit overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 max-w-sm w-full bg-slate-900/90 border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl shadow-amber-500/10"
            >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                    <Lock size={32} className="text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                    {title}
                </h3>
                
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    {description}
                </p>

                <button 
                    onClick={onUpgrade}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold shadow-lg shadow-amber-500/25 transition-all flex flex-col items-center justify-center gap-1 group"
                >
                    <span className="flex items-center gap-2 text-lg">
                        <Crown size={18} className="fill-white/50" />
                        Upgrade Now
                    </span>
                    <span className="text-[10px] uppercase tracking-widest opacity-80 font-mono">Lifetime Access • One Time Payment</span>
                </button>
            </motion.div>
        </div>
    );
};

