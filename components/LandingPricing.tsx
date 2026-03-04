
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap, Crown, ChevronDown, ChevronUp, HelpCircle, Sparkles, Star, Shield, Loader2, X, LogOut, AlertTriangle, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FAQItemProps {
    question: string;
    answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-white/5 last:border-0">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group transition-colors"
            >
                <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-cyan-400' : 'text-slate-300 group-hover:text-white'}`}>
                    {question}
                </span>
                <div className={`p-2 rounded-lg transition-all ${isOpen ? 'bg-cyan-500/10 text-cyan-400 rotate-180' : 'bg-white/5 text-slate-500 group-hover:text-slate-300'}`}>
                    <ChevronDown size={20} />
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-slate-400 leading-relaxed">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const LandingPricing: React.FC = () => {
    const { currentUser, signInWithGoogle } = useAuth();
    const [isIndia, setIsIndia] = useState(false);

    useEffect(() => {
        try {
            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (userTimeZone.includes('Calcutta') || userTimeZone.includes('Kolkata')) {
                setIsIndia(true);
            }
        } catch (e) {
            console.error("Region detection failed", e);
        }
    }, []);

    const handleAction = () => {
        if (!currentUser) {
            signInWithGoogle();
        } else {
            window.location.reload();
        }
    };

    const handleGuest = () => {
        // This is handled by App.tsx logic for guest mode
        window.location.reload();
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: { 
            y: 0, 
            opacity: 1,
            transition: { type: "spring", stiffness: 50, damping: 15 }
        }
    };

    return (
        <section className="w-full max-w-7xl mx-auto px-6 py-24 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-16 space-y-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest"
                >
                    <Zap size={12} className="fill-indigo-400" /> Pricing Plans
                </motion.div>
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl font-bold text-white tracking-tight"
                >
                    Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Level Up?</span>
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-400 text-lg max-w-2xl mx-auto"
                >
                    Choose the plan that fits your ambition. From focused students to productivity legends.
                </motion.p>
                
                {/* Currency Toggle */}
                <motion.button 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    onClick={() => setIsIndia(!isIndia)}
                    className="mt-4 text-[10px] text-slate-500 hover:text-indigo-400 underline transition-colors uppercase tracking-widest font-bold"
                >
                    {isIndia ? "Switch to Global Prices" : "Switch to India Prices"}
                </motion.button>
            </div>

            {/* Pricing Cards */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-24"
            >
                {/* Card 0: The Student (Free) */}
                <motion.div 
                    variants={cardVariants}
                    className="bg-slate-900/30 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 relative overflow-hidden group hover:bg-slate-900/50 transition-all duration-500"
                >
                    <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            The Student <BookOpen size={20} className="text-slate-400" />
                        </h3>
                        <p className="text-slate-400 text-sm">Essential tools for local focus.</p>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white tracking-tight">
                            Free
                        </span>
                    </div>

                    <div className="space-y-4 flex-1">
                        <FeatureItem text="Ads Included" />
                        <FeatureItem text="Basic Pomodoro & Zen" />
                        <FeatureItem text="Detailed Analytics" />
                        <FeatureItem text="Exam Tracker" />
                        <FeatureItem text="Habit Forger" />
                        <FeatureItem text="Daily Journal" />
                    </div>

                    <button 
                        onClick={handleGuest}
                        className="w-full py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Continue as Guest <ArrowRight size={18} />
                    </button>
                </motion.div>

                {/* Card 1: The Focus Pro */}
                <motion.div 
                    variants={cardVariants}
                    className="bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 relative overflow-hidden group hover:bg-slate-900/60 transition-all duration-500"
                >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                The Focus Pro <Zap size={20} className="text-indigo-400 fill-indigo-400" />
                            </h3>
                        </div>
                        <p className="text-slate-400 text-sm">Serious about productivity and cloud sync.</p>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-white tracking-tight">
                            {isIndia ? '₹99' : '$4.99'}
                            <span className="text-base opacity-60 font-normal ml-1">/mo</span>
                        </span>
                        <span className="text-lg text-slate-600 line-through decoration-slate-600/50">
                            {isIndia ? '₹149' : '$6.99'}
                        </span>
                    </div>

                    <div className="space-y-4 flex-1">
                        <FeatureItem text="NO ADS" highlight />
                        <FeatureItem text="Secure Cloud Sync" highlight />
                        <FeatureItem text="Global Leaderboards" />
                        <FeatureItem text="Friend Challenges" />
                        <FeatureItem text="Advanced Analytics" />
                    </div>

                    <button 
                        onClick={handleAction}
                        className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Upgrade Now <ArrowRight size={18} />
                    </button>
                </motion.div>

                {/* Card 2: The Focus Legend */}
                <motion.div 
                    variants={cardVariants}
                    className="bg-slate-900/60 backdrop-blur-md border-2 border-amber-500/30 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.1)] group hover:bg-slate-900/80 transition-all duration-500"
                >
                    <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-6 py-2 rounded-bl-2xl uppercase tracking-tighter">
                        Best Value • 2 Months Free
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            The Focus Legend <Crown size={24} className="text-amber-400 fill-amber-400" />
                        </h3>
                        <p className="text-slate-400 text-sm">For the relentless achiever who wants it all.</p>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-white tracking-tight">
                                {isIndia ? '₹999' : '$40.99'}
                                <span className="text-base opacity-60 font-normal ml-1">/yr</span>
                            </span>
                            <span className="text-lg text-slate-600 line-through decoration-slate-600/50">
                                {isIndia ? '₹1,799' : '$84.99'}
                            </span>
                        </div>
                        <div className="text-[10px] text-amber-500/80 font-bold uppercase tracking-widest">
                            Billed annually
                        </div>
                    </div>

                    <div className="space-y-4 flex-1">
                        <FeatureItem text="All Pro Features" highlight />
                        <FeatureItem text="Founding Member Badge" highlight />
                        <FeatureItem text="Priority Support" />
                        <FeatureItem text="Early Access Features" />
                        <FeatureItem text="Exclusive Zen Backgrounds" />
                    </div>

                    <button 
                        onClick={handleAction}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Become a Legend <Crown size={18} className="fill-white" />
                    </button>
                </motion.div>
            </motion.div>

            {/* FAQ Section */}
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                        <HelpCircle size={24} className="text-cyan-400" /> Frequently Asked Questions
                    </h3>
                    <p className="text-slate-500 text-sm">Everything you need to know about EkagraZone Premium.</p>
                </div>
                
                <div className="bg-slate-900/30 backdrop-blur-sm border border-white/5 rounded-[2rem] p-4 md:p-8">
                    <FAQItem 
                        question="Can I cancel anytime?" 
                        answer="Yes, absolutely. You can cancel your subscription at any time through your account settings. You'll continue to have access to premium features until the end of your current billing period." 
                    />
                    <FAQItem 
                        question="What happens after the year ends?" 
                        answer="For the Legend plan, your subscription will automatically renew at the same price unless you choose to cancel. We'll send you a reminder before the renewal date so you're never surprised." 
                    />
                    <FAQItem 
                        question="Is there a free version?" 
                        answer="Yes! The basic EkagraZone experience—including the focus timer, basic analytics, and local task management—is always free. We believe everyone should have access to tools that help them focus." 
                    />
                </div>

                {/* Support Section */}
                <div className="mt-12 p-8 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
                    <div className="text-center md:text-left space-y-2">
                        <h4 className="text-white font-bold text-xl flex items-center justify-center md:justify-start gap-2">
                            <HelpCircle size={20} className="text-indigo-400" /> Still have questions?
                        </h4>
                        <p className="text-slate-400 text-sm max-w-md">
                            Our support team is ready to help you optimize your workflow. Reach out directly.
                        </p>
                        <div className="text-xs font-mono text-indigo-300/70 bg-indigo-900/30 px-3 py-1 rounded-full inline-block">
                            ekagrazone.help@gmail.com
                        </div>
                    </div>
                    <a 
                        href="mailto:ekagrazone.help@gmail.com"
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95"
                    >
                        Contact Support <ArrowRight size={18} />
                    </a>
                </div>
            </div>
        </section>
    );
};

const FeatureItem: React.FC<{ text: string; highlight?: boolean }> = ({ text, highlight }) => (
    <div className="flex items-center gap-3">
        <div className={`flex-none w-5 h-5 rounded-full flex items-center justify-center ${highlight ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-500'}`}>
            <Check size={12} strokeWidth={3} />
        </div>
        <span className={`text-sm ${highlight ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>{text}</span>
    </div>
);

const ArrowRight: React.FC<{ size?: number }> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);
