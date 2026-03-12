import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Zap, Crown, LogOut, Shield, Globe, AlertTriangle, Star, Sparkles, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const PricingPage: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { continueAsGuest, currentUser, signInWithGoogle } = useAuth();
    const [isIndia, setIsIndia] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);

    useEffect(() => {
        try {
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Check for both modern and legacy timezone names
            if (userTimeZone.includes('Calcutta') || userTimeZone.includes('Kolkata')) {
                setIsIndia(true);
            }
        } catch (e) {
            console.error("Region detection failed", e);
        }
    }, []);

    const handleGuestSwitch = async () => {
        if (onClose) {
            onClose();
            return;
        }
        // Set guest flag FIRST so when auth state changes, we fall into guest mode
        await continueAsGuest(); 
        await signOut(auth);
    };

    const handleUpgrade = async (plan: 'monthly' | 'yearly') => {
        if (!currentUser) {
            try {
                await signInWithGoogle();
            } catch (error) {
                console.error("Sign in failed", error);
            }
            return;
        }
        
        setIsUpgrading(true);
        window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text: "Processing upgrade...", state: "Thinking" } }));
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            await setDoc(doc(db, 'users', currentUser.uid), {
                hasPremium: true,
                subscriptionType: plan,
                subscriptionDate: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
            
            window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text: "Welcome to Premium! Let's achieve greatness.", state: "Happy" } }));
            // Reload to trigger auth check and remove lock
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error("Upgrade failed", error);
            setIsUpgrading(false);
            window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text: "Upgrade failed. Please try again.", state: "Alert" } }));
            alert("Upgrade failed. Please try again.");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-6 md:p-12 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest"
                    >
                        <Globe size={12} /> {isIndia ? 'India Pricing' : 'Global Pricing'}
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-4xl md:text-6xl font-bold text-white tracking-tight"
                    >
                        Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Focus Level</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-lg max-w-2xl mx-auto"
                    >
                        Unlock the full potential of your mind with EkagraZone Premium.
                    </motion.p>
                </div>

                {/* Pricing Cards */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
                >
                    
                    {/* Card 1: The Student (Free) */}
                    <motion.div variants={cardVariants} className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden group hover:bg-slate-900/80 transition-colors">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white">The Student</h3>
                            <p className="text-slate-400 text-sm">Essential tools for local focus.</p>
                        </div>
                        <div className="text-3xl font-bold text-white">Free</div>
                        
                        <div className="space-y-4 flex-1">
                            <FeatureItem icon={<Check size={16} />} text="Ads Included" />
                            <FeatureItem icon={<Check size={16} />} text="Basic Pomodoro & Zen Mode" />
                            <FeatureItem icon={<Check size={16} />} text="Detailed Analytics" />
                            <FeatureItem icon={<Check size={16} />} text="Exam Tracker (Mock tests)" />
                            <FeatureItem icon={<Check size={16} />} text="Habit Forger" />
                            <FeatureItem icon={<Check size={16} />} text="Daily Journal" />
                            <FeatureItem icon={<Check size={16} />} text="Peaceful Sounds" />
                            
                            <div className="my-4 border-t border-white/5" />
                            
                            <FeatureItem icon={<AlertTriangle size={16} className="text-amber-500" />} text="No Cloud Sync" subtext="Data lost if cache cleared" warning />
                            <FeatureItem icon={<X size={16} className="text-slate-500" />} text="No Global Leaderboards" muted />
                            <FeatureItem icon={<X size={16} className="text-slate-500" />} text="No Friends Challenge" muted />
                        </div>

                        <button 
                            onClick={handleGuestSwitch}
                            className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {onClose ? <X size={18} /> : <LogOut size={18} />} 
                            {onClose ? 'Continue as Guest' : 'Sign Out & Continue as Guest'}
                        </button>
                    </motion.div>

                    {/* Card 2: The Focus Pro (Monthly) */}
                    <motion.div variants={cardVariants} className="bg-slate-900/80 border border-indigo-500/30 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden shadow-2xl shadow-indigo-500/10 scale-100 lg:scale-105 z-10">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                The Focus Pro <Zap size={20} className="text-indigo-400 fill-indigo-400" />
                            </h3>
                            <p className="text-indigo-200/60 text-sm">Serious about productivity.</p>
                        </div>
                        
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-white">
                                {isIndia ? '₹99' : '$4.99'}
                                <span className="text-sm opacity-80 font-normal">/mo</span>
                            </span>
                            <span className="text-lg text-slate-500 line-through decoration-slate-500/50">
                                {isIndia ? '₹149' : '$6.99'}
                                <span className="text-xs opacity-60">/mo</span>
                            </span>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full ml-auto">
                                Newly Launched Bonus
                            </span>
                        </div>

                        <div className="space-y-4 flex-1">
                            <FeatureItem icon={<Check size={16} className="text-emerald-400" />} text="NO ADS" highlight />
                            <FeatureItem icon={<Check size={16} className="text-emerald-400" />} text="Secure Cloud Sync" highlight />
                            <FeatureItem icon={<Check size={16} className="text-emerald-400" />} text="Global Leaderboards" highlight />
                            <FeatureItem icon={<Check size={16} className="text-emerald-400" />} text="Friend Challenges" highlight />
                            <FeatureItem icon={<Check size={16} />} text="Everything in Free" />
                        </div>

                        <button 
                            onClick={() => handleUpgrade('monthly')}
                            disabled={isUpgrading}
                            className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-indigo-500/25"
                        >
                            {isUpgrading ? <Loader2 className="animate-spin" /> : !currentUser ? 'Sign In to Upgrade' : 'Upgrade to Pro Access'}
                        </button>
                    </motion.div>

                    {/* Card 3: The Focus Legend (Yearly) */}
                    <motion.div variants={cardVariants} className="bg-slate-900/90 border-2 border-amber-500/50 rounded-3xl p-8 flex flex-col gap-6 relative overflow-hidden shadow-[0_0_40px_rgba(245,158,11,0.15)]">
                        {/* Badge */}
                        <div className="absolute top-0 right-0 bg-amber-500 text-slate-900 text-xs font-bold px-4 py-1.5 rounded-bl-2xl">
                            2 MONTHS FREE + BEST VALUE
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                The Focus Legend <Crown size={20} className="text-amber-400 fill-amber-400" />
                            </h3>
                            <p className="text-amber-200/60 text-sm">For the relentless achiever.</p>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-white">
                                    {isIndia ? '₹999' : '$40.99'}
                                    <span className="text-sm opacity-80 font-normal">/yr</span>
                                </span>
                                <span className="text-lg text-slate-500 line-through decoration-slate-500/50">
                                    {isIndia ? '₹1,799' : '$84.99'}
                                    <span className="text-xs opacity-60">/yr</span>
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                Billed annually
                            </div>
                        </div>
                        <div className="text-xs text-amber-400 font-bold">
                            {isIndia ? 'Massive ₹800 Saving' : 'Save over 50%'}
                        </div>

                        <div className="space-y-4 flex-1">
                            <FeatureItem icon={<Star size={16} className="text-amber-400 fill-amber-400" />} text="All Pro Features" highlight />
                            <FeatureItem icon={<Crown size={16} className="text-amber-400 fill-amber-400" />} text="Exclusive 'Founding Member' Badge" highlight />
                            <FeatureItem icon={<Sparkles size={16} className="text-amber-400" />} text="Priority Support" />
                            <FeatureItem icon={<Shield size={16} className="text-amber-400" />} text="Early Access to New Features" />
                        </div>

                        <button 
                            onClick={() => handleUpgrade('yearly')}
                            disabled={isUpgrading}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-amber-500/25 group"
                        >
                            {isUpgrading ? <Loader2 className="animate-spin" /> : (
                                <>
                                    <Crown size={18} className="fill-white group-hover:scale-110 transition-transform" />
                                    {!currentUser ? 'Sign In & Become a Legend' : 'Become a Legend'}
                                </>
                            )}
                        </button>
                        <p className="text-center text-[10px] text-slate-500 font-mono">2 MONTHS FREE INCLUDED</p>
                    </motion.div>

                </motion.div>

                <div className="mt-16 text-center space-y-2">
                    <button 
                        onClick={() => setIsIndia(!isIndia)}
                        className="text-[10px] text-slate-600 hover:text-slate-400 underline cursor-pointer transition-colors"
                    >
                        {isIndia ? "Not in India? Switch to Global Prices" : "In India? Switch to Local Prices"}
                    </button>
                    <p className="text-slate-500 text-sm">
                        Secure payment powered by Stripe. Cancel anytime.
                    </p>
                </div>
            </div>
        </div>
    );
};

const FeatureItem: React.FC<{ icon: React.ReactNode; text: string; subtext?: string; highlight?: boolean; warning?: boolean; muted?: boolean }> = ({ icon, text, subtext, highlight, warning, muted }) => (
    <div className={`flex items-start gap-3 ${muted ? 'opacity-50' : ''}`}>
        <div className={`mt-0.5 ${highlight ? 'text-white' : warning ? 'text-amber-500' : 'text-slate-400'}`}>
            {icon}
        </div>
        <div>
            <div className={`text-sm font-medium ${highlight ? 'text-white' : warning ? 'text-amber-400' : 'text-slate-300'}`}>
                {text}
            </div>
            {subtext && <div className="text-[10px] text-slate-500 mt-0.5">{subtext}</div>}
        </div>
    </div>
);
