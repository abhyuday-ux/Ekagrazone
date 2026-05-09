import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Minus, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface PricingPageProps {
  onClose: () => void;
  onUpgrade: () => void;
}

const FAQS = [
  {
    question: "Is this really a one-time payment?",
    answer: "Yes! There are no subscriptions, no hidden fees, and no recurring charges. You pay ₹149 once and get lifetime access to all current and future Pro features."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We support all major payment methods including UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and Netbanking via Razorpay."
  },
  {
    question: "Can I get a refund if I don't like it?",
    answer: "Absolutely. We offer a 7-day no-questions-asked refund policy. Just email our support and we'll process your refund immediately."
  }
];

const getInitialTime = () => {
  const stored = localStorage.getItem('ekagra_countdown');
  if (stored) return JSON.parse(stored);
  const initial = {
    hours: Math.floor(Math.random() * 20) + 2,
    minutes: Math.floor(Math.random() * 60),
    seconds: Math.floor(Math.random() * 60)
  };
  localStorage.setItem('ekagra_countdown', JSON.stringify(initial));
  return initial;
};

export const PricingPage: React.FC<PricingPageProps> = ({ onClose, onUpgrade }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(getInitialTime);

  useEffect(() => {
    const iv = setInterval(() => {
      setTimeLeft((prev: { hours: number; minutes: number; seconds: number; }) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 23; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const features = [
    { name: 'Focus Timer', free: true, pro: true },
    { name: 'Basic Stats', free: true, pro: true },
    { name: 'All Subjects', free: true, pro: true },
    { name: 'Local Storage', free: true, pro: true },
    { name: 'Cloud Sync', free: false, pro: true },
    { name: 'Syllabus Tracker', free: false, pro: true },
    { name: 'Study Rooms', free: false, pro: true },
    { name: 'Collaborative Whiteboard', free: false, pro: true },
    { name: 'Smart Study Planner', free: false, pro: true },
    { name: 'Journal', free: false, pro: true },
    { name: 'Habits Tracker', free: false, pro: true },
    { name: 'Social & Friends', free: false, pro: true },
    { name: 'Exam Tracker', free: false, pro: true },
    { name: 'Mock Tests', free: false, pro: true },
    { name: 'Priority Support', free: false, pro: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] bg-slate-950 overflow-y-auto"
    >
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="min-h-full flex flex-col pt-20 pb-12 px-4 sm:px-6 relative z-10 max-w-4xl mx-auto">
        
        <button
          onClick={onClose}
          className="fixed top-6 right-6 w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-20 cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6">
            EkagraZone Pro
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            One time. Lifetime access.
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Unlock the ultimate study companion and join top percentile students.
          </p>
        </div>

        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
        <div className="w-full max-w-lg mx-auto bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-8 mb-16 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500" />
          
          <div className="flex items-center gap-2 justify-center mb-4">
            <span className="text-xs text-slate-500">
              Sale ends in:
            </span>
            <div className="flex items-center gap-1 font-mono text-sm">
              {[
                { val: timeLeft.hours, label: 'h' },
                { val: timeLeft.minutes, label: 'm' },
                { val: timeLeft.seconds, label: 's' },
              ].map((t, i) => (
                <React.Fragment key={i}>
                  <span className="bg-slate-800 border border-white/10 px-2 py-0.5 rounded-lg text-white font-bold min-w-[2rem] text-center">
                    {String(t.val).padStart(2, '0')}
                  </span>
                  <span className="text-slate-600 text-xs">{t.label}</span>
                  {i < 2 && <span className="text-slate-600">:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2 mb-6">
            {/* Launch sale badge */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-bold uppercase tracking-widest"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              🔥 Launch Sale — Ends Soon
            </motion.div>

            {/* Crossed out original price */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="text-2xl font-bold text-slate-500">
                  ₹499
                </span>
                {/* Strikethrough line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/60 -rotate-6 transform" />
              </div>
              <span className="text-slate-600 text-sm">→</span>
              {/* Actual price */}
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black text-white leading-none">₹149</span>
                <span className="text-slate-400 text-sm mb-1">
                  one-time
                </span>
              </div>
            </div>

            {/* Savings badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              ✓ You save ₹350 (70% off)
            </div>

            {/* Urgency text */}
            <p className="text-slate-500 text-xs text-center max-w-xs mt-2">
              Price will increase to ₹499 after the beta period. Lock in lifetime access now.
            </p>
          </div>

          <motion.button
            onClick={onUpgrade}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-2xl font-black text-lg relative overflow-hidden bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 bg-[length:200%_100%] text-white shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 cursor-pointer"
            style={{
              animation: 'gradientShift 3s ease infinite'
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
            <Zap size={20} className="relative z-10" />
            <span className="relative z-10">
              Get Lifetime Access — ₹149
            </span>
          </motion.button>
          
          <div className="flex items-center justify-center gap-4 py-3 border-t border-b border-white/5 my-4 w-full">
            <div className="flex -space-x-2">
              {['#06b6d4','#8b5cf6','#f97316','#10b981','#f43f5e']
                .map((color, i) => (
                <div key={i}
                  className="w-7 h-7 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{background: color}}
                >
                  {['R','P','A','S','M'][i]}
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-400">
              <span className="text-white font-bold">500+</span> students already unlocked Pro
            </div>
          </div>

          <div className="text-center mt-4">
            <button onClick={onClose} className="text-sm text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
              or continue with free plan
            </button>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Compare Plans</h2>
          
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] border-b border-white/10 bg-slate-900/80">
              <div className="p-4 text-sm font-medium text-slate-400">Feature</div>
              <div className="p-4 text-center text-sm font-bold text-slate-300">Free</div>
              <div className="p-4 text-center relative flex flex-col items-center justify-center gap-1">
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest relative z-10">Pro</div>
                <div className="text-[9px] text-slate-500 relative z-10">₹149 once</div>
                <div className="absolute inset-0 bg-cyan-500/10 border-x border-t border-cyan-500/30 pointer-events-none" />
              </div>
            </div>
            
            {features.map((feature, i) => (
              <div key={i} className={`grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_120px_120px] sm:text-base text-sm ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                <div className="p-4 text-slate-300 border-t border-white/5 flex items-center">
                  {feature.name}
                </div>
                <div className="p-4 border-t border-white/5 flex items-center justify-center">
                  {feature.free ? (
                    <Check size={18} className="text-slate-500" />
                  ) : (
                    <Minus size={18} className="text-slate-700" />
                  )}
                </div>
                <div className="p-4 border-t border-white/5 flex items-center justify-center relative">
                  <div className="absolute inset-0 border-x border-cyan-500/10 bg-cyan-500/[0.02]" />
                  {feature.pro ? (
                    <Check size={18} className="text-cyan-400 relative z-10" />
                  ) : (
                    <Minus size={18} className="text-slate-700 relative z-10" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <div key={index} className="bg-slate-900/60 border border-white/10 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="font-bold text-white">{faq.question}</span>
                  {openFaq === index ? <ChevronUp className="text-cyan-400" size={18}/> : <ChevronDown className="text-slate-400" size={18}/>}
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 text-slate-400 leading-relaxed overflow-hidden text-sm"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-8 border-t border-white/10">
          <h2 className="text-2xl font-bold text-white mb-6">Ready to upgrade?</h2>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-cyan-500 text-slate-950 font-black text-lg hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer hover:scale-[1.02] gap-2"
          >
            <Zap size={18} /> Get Pro for ₹149 →
          </button>
        </div>

      </div>
    </motion.div>
  );
};
