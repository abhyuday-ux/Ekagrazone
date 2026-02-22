import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface HeaderAdProps {
    onClick: () => void;
    isZenMode?: boolean;
}

export const HeaderAd: React.FC<HeaderAdProps> = ({ onClick, isZenMode = false }) => {
    return (
        <motion.div 
            initial={{ y: -50, opacity: 0, x: isZenMode ? "-50%" : 0 }}
            animate={{ y: 0, opacity: 1, x: isZenMode ? "-50%" : 0 }}
            className={`
                ${isZenMode ? 'fixed top-[10px] left-1/2 w-[90%] max-w-lg z-[9999]' : 'w-full z-[50] flex-none relative'}
                flex justify-center items-center
            `}
        >
            <button 
                onClick={onClick}
                className="group relative overflow-hidden rounded-full w-full mx-auto"
            >
                {/* Glassmorphism Container */}
                <div className={`
                    w-full
                    h-[50px] md:h-[90px] px-4 md:px-6
                    ${isZenMode ? 'bg-slate-900/40' : 'bg-slate-900/60'} backdrop-blur-xl 
                    border border-white/10 rounded-full
                    shadow-lg flex items-center justify-center gap-3 
                    transition-all duration-300 
                    group-hover:bg-slate-900/80 group-hover:border-indigo-500/30 group-hover:scale-[1.01]
                `}>
                    {/* AdSense Placeholder Container */}
                    <div className="ad-container absolute inset-0 w-full h-full pointer-events-none opacity-0">
                        {/* TODO: Replace this placeholder with Google AdSense <ins> tag once approved. */}
                    </div>

                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    
                    <Sparkles size={16} className="text-amber-400 animate-pulse flex-shrink-0" />
                    
                    {/* Mobile Text (< md) */}
                    <div className="flex md:hidden items-center gap-2 text-xs whitespace-nowrap">
                        <span className="font-medium text-slate-200">
                            Remove Ads
                        </span>
                        <span className="text-slate-500">-</span>
                        <span className="text-emerald-400 font-bold">
                            ₹99
                        </span>
                    </div>

                    {/* Desktop Text (>= md) */}
                    <div className="hidden md:flex items-center gap-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                        <span className="font-medium text-slate-200">
                            Remove Ads & Unlock Cloud Sync
                        </span>
                        <span className="text-slate-500">—</span>
                        <span className="text-slate-400">
                            Upgrade for just <span className="text-emerald-400 font-bold">₹99</span>
                        </span>
                    </div>
                </div>
            </button>
            
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </motion.div>
    );
};
