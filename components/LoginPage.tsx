
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EkagraLogo } from './EkagraLogo';
import { Zap, BarChart2, Timer, Workflow, CheckCircle2, Shield, ArrowRight, Layout, Calendar, CheckSquare, Sparkles, ChevronDown, ChevronUp, Star, Users, Globe, Smartphone, Laptop, Cloud, CloudOff } from 'lucide-react';
import { motion, useScroll, useTransform, Variants, AnimatePresence } from 'framer-motion';
import { ContainerScroll } from './ContainerScroll';
import { Footer } from './Footer';

const SHOWCASE_ITEMS = [
  {
    title: "Command Center",
    description: "Your mission control for productivity. Get a bird's-eye view of your daily progress, focus rhythm, and active streaks in one beautiful interface.",
    image: "https://i.ibb.co/7JQz3mtH/image.png"
  },
  {
    title: "Deep Focus Zone",
    description: "Enter a distraction-free state with our precision timer. Customize intervals, track sessions, and immerse yourself in work.",
    image: "https://i.ibb.co/HfmcGh5D/image.png"
  },
  {
    title: "Zen Mode",
    description: "Achieve flow state with immersive, full-screen backgrounds. Minimalist visuals help you stay locked in for hours.",
    image: "https://i.ibb.co/ppNphtb/image.png"
  },
  {
    title: "Habit Forge",
    description: "Build lasting rituals. Visualize your consistency with heatmaps and advanced streak tracking to maintain momentum.",
    image: "https://i.ibb.co/twLV1SyM/image.png"
  },
  {
    title: "Mindful Reflection",
    description: "Daily journaling designed for growth. Track energy levels, stress, and gratitude to optimize your mental performance.",
    image: "https://i.ibb.co/bnQ5p5v/image.png"
  },
  {
    title: "Advanced Analytics",
    description: "Data-driven insights for your brain. Analyze study patterns, subject breakdowns, and session quality over time.",
    image: "https://i.ibb.co/nqQjLY2g/image.png"
  }
];

const FAQS = [
  {
    question: "Is EkagraZone free to use?",
    answer: "EkagraZone has a free plan with core features. Pro features including cloud sync, study rooms, and full syllabus tracking are available with a one-time Pro upgrade."
  },
  {
    question: "Does it work offline?",
    answer: "Yes! EkagraZone is built with a local-first architecture. Your data is saved to your device first and syncs to the cloud when you're back online."
  },
  {
    question: "Can I use it on my phone?",
    answer: "Absolutely. EkagraZone works as a Progressive Web App (PWA) on iOS and Android. Install it from your browser — no app store needed."
  },
  {
    question: "Is my data private?",
    answer: "100%. We use Firebase's enterprise-grade security. Your journal entries and study data are encrypted and only accessible by you."
  },
  {
    question: "Does it have JEE and NEET syllabus?",
    answer: "Yes! The complete chapter-by-topic syllabus for both JEE Advanced and NEET is built right into the app. Import it in one click."
  },
  {
    question: "What are Study Rooms?",
    answer: "Study Rooms let you study with friends in real-time — synced Pomodoro timer, live chat, and a collaborative whiteboard. Like Google Meet but for studying."
  },
];

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, continueAsGuest } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  
  const backgroundY = useTransform(scrollY, [0, 1000], [0, 200]);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const triggerSpin = () => {
      if (isSpinning) return;
      setIsSpinning(true);
      setTimeout(() => setIsSpinning(false), 700);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: { 
        opacity: 1, 
        y: 0, 
        filter: 'blur(0px)',
        transition: { type: "spring", stiffness: 40, damping: 10 } 
    }
  };

  // Feature Card Animation Variants
  const cardHoverVariants: Variants = {
      hover: { y: -5, transition: { type: "spring", stiffness: 300 } }
  };

  return (
    <div className="min-h-screen bg-[#050511] text-slate-200 font-sans selection:bg-cyan-500/30 flex flex-col relative overflow-x-hidden pb-24 md:pb-0">
      
      {/* Dynamic Background */}
      <motion.div style={{ y: backgroundY }} className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-cyan-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[8000ms]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-[10000ms]" />
          <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-emerald-500/5 blur-[150px] rounded-full mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </motion.div>

      {/* Navbar */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`sticky top-0 w-full max-w-full px-6 py-4 flex justify-between items-center z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-xl' : 'bg-transparent'}`}
      >
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={triggerSpin}>
            <EkagraLogo 
                className="w-8 h-8 flex-none transition-transform"
                style={{ animation: isSpinning ? 'spin 0.7s ease-in-out' : 'none' }}
            />
            <span className="text-lg font-bold tracking-wide text-white">EKAGRAZONE</span>
          </div>
          <div className="md:hidden flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <Shield size={12} /> Free & Private
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
              <span className="font-hand text-xl text-cyan-200/80 -rotate-2 mr-2">Totally free & local</span>
              <span className="flex items-center gap-1.5"><Shield size={14} className="text-emerald-400"/> Private by Design</span>
              <button
                onClick={signInWithGoogle}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 rounded-xl text-sm font-bold hover:bg-cyan-500/25 transition-colors"
              >
                Get Started <ArrowRight size={14} />
              </button>
          </div>
      </motion.nav>

      {/* 3D Container Scroll Section */}
      <ContainerScroll />

      {/* Main Hero Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20 items-center relative z-10 py-8 lg:py-20">
          
          {/* Left Column: Copy & Actions */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 max-w-2xl"
          >
             
             {/* Badge */}
             <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                India's #1 Study Productivity App
             </motion.div>

             {/* Headline */}
             <div className="relative">
                 <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1]">
                    Crack your exam.<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Master your focus.</span>
                 </motion.h1>
                 <motion.span 
                    variants={itemVariants} 
                    className="absolute -right-4 -top-8 hidden lg:block font-hand text-3xl text-yellow-300 rotate-6"
                 >
                    <Sparkles className="inline-block mr-1" size={24} />
                    Unlock your potential
                 </motion.span>
             </div>

             <motion.p variants={itemVariants} className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-lg">
                Built for JEE, NEET & BITSAT aspirants. EkagraZone combines a precision timer, full syllabus tracker, and study rooms into one beautiful workspace.
                <span className="block mt-2 font-hand text-xl text-cyan-200/70">Designed for deep work enthusiasts.</span>
             </motion.p>

             {/* Action Buttons */}
             <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-4">
                 <button 
                    onClick={signInWithGoogle}
                    className="h-14 px-8 bg-white text-slate-900 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-3 transition-all font-bold text-base shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 group relative overflow-hidden w-full sm:w-auto"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Get Started Free
                 </button>
                 
                 <button 
                    onClick={continueAsGuest}
                    className="font-hand text-xl sm:text-2xl lg:text-3xl text-slate-400 hover:text-cyan-300 transition-colors relative group px-4 py-2 w-full sm:w-auto text-center"
                 >
                    Continue as Guest
                    <span className="absolute bottom-2 left-4 right-4 h-0.5 bg-cyan-300/50 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></span>
                 </button>
             </motion.div>

             <motion.div variants={itemVariants} className="flex items-center gap-6 py-2 flex-wrap">
                {[
                  { value: '500+', label: 'Students' },
                  { value: 'JEE', label: '& NEET Ready' },
                  { value: '100%', label: 'Free to Start' },
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-lg font-bold font-mono text-white">{stat.value}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">{stat.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1 ml-auto">
                  {[...Array(5)].map((_,i) => (
                    <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">5.0</span>
                </div>
             </motion.div>

             {/* Features Grid (Bento Style with "Screenshots") */}
             <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-8">
                 {/* Feature 1: Timer */}
                 <motion.div 
                    variants={itemVariants} 
                    whileHover="hover"
                    className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 backdrop-blur-sm hover:bg-white/5 transition-colors overflow-hidden group cursor-default"
                 >
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400"><Timer size={18} /></div>
                        <h3 className="font-bold text-slate-200 text-sm">Focus Timer</h3>
                     </div>
                     {/* Mini UI Mockup */}
                     <div className="w-full h-24 bg-slate-950/50 rounded-lg border border-white/5 relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                        <motion.div 
                            className="w-16 h-16 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative"
                            variants={{ hover: { rotate: 360 } }}
                            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
                        >
                            <motion.div 
                                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-12 h-12 rounded-full bg-cyan-500/10" 
                            />
                        </motion.div>
                        <motion.span 
                            variants={{ hover: { scale: 1.1 } }}
                            className="absolute text-[10px] font-mono font-bold text-white"
                        >
                            25:00
                        </motion.span>
                     </div>
                 </motion.div>

                 {/* Feature 2: Analytics */}
                 <motion.div 
                    variants={itemVariants} 
                    whileHover="hover"
                    className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 backdrop-blur-sm hover:bg-white/5 transition-colors overflow-hidden group cursor-default"
                 >
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400"><BarChart2 size={18} /></div>
                        <h3 className="font-bold text-slate-200 text-sm">Deep Analytics</h3>
                     </div>
                     {/* Mini UI Mockup */}
                     <div className="w-full h-24 bg-slate-950/50 rounded-lg border border-white/5 relative flex items-end justify-between px-3 pb-3 gap-1 overflow-hidden">
                        {[0.5, 0.75, 0.6, 1, 0.5].map((h, i) => (
                            <motion.div 
                                key={i}
                                variants={{ hover: { height: `${h * 100}%` } }}
                                initial={{ height: '10%' }}
                                animate={{ height: `${h * 80}%` }} // Default resting height
                                className={`w-1/5 rounded-t-sm ${i===3 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-emerald-500/30'}`}
                            />
                        ))}
                     </div>
                 </motion.div>

                 {/* Feature 3: Habit Forge */}
                 <motion.div 
                    variants={itemVariants} 
                    whileHover="hover"
                    className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 backdrop-blur-sm hover:bg-white/5 transition-colors overflow-hidden group cursor-default"
                 >
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400"><Workflow size={18} /></div>
                        <h3 className="font-bold text-slate-200 text-sm">Habit Forge</h3>
                     </div>
                     {/* Mini UI Mockup */}
                     <div className="w-full h-24 bg-slate-950/50 rounded-lg border border-white/5 relative flex flex-col justify-center px-3 gap-2 overflow-hidden">
                        <div className="flex items-center gap-2">
                            <motion.div variants={{ hover: { scale: [1, 1.2, 1] } }} className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center text-[8px] text-black font-bold">✓</motion.div>
                            <motion.div variants={{ hover: { width: '80%' } }} className="h-2 w-16 bg-slate-800 rounded-full transition-all" />
                        </div>
                        <div className="flex items-center gap-2 opacity-50">
                            <div className="w-4 h-4 rounded border border-slate-700"></div>
                            <div className="h-2 w-12 bg-slate-800 rounded-full"></div>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.div variants={{ hover: { scale: [1, 1.2, 1] } }} transition={{ delay: 0.1 }} className="w-4 h-4 rounded bg-amber-500 flex items-center justify-center text-[8px] text-black font-bold">✓</motion.div>
                            <motion.div variants={{ hover: { width: '90%' } }} className="h-2 w-20 bg-slate-800 rounded-full transition-all" />
                        </div>
                     </div>
                 </motion.div>

                 {/* Feature 4: Task Planner */}
                 <motion.div 
                    variants={itemVariants} 
                    whileHover="hover"
                    className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3 backdrop-blur-sm hover:bg-white/5 transition-colors overflow-hidden group cursor-default"
                 >
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400"><Calendar size={18} /></div>
                        <h3 className="font-bold text-slate-200 text-sm">Task Planner</h3>
                     </div>
                     {/* Mini UI Mockup */}
                     <div className="w-full h-24 bg-slate-950/50 rounded-lg border border-white/5 relative flex gap-1 p-2 overflow-hidden">
                        <div className="flex-1 bg-slate-800/50 rounded flex flex-col gap-1 p-1">
                            <div className="h-1.5 w-8 bg-slate-700 rounded"></div>
                            <motion.div variants={{ hover: { x: 5 } }} className="h-6 w-full bg-slate-700/50 rounded border border-white/5" />
                            <motion.div variants={{ hover: { x: 5 } }} transition={{ delay: 0.1 }} className="h-6 w-full bg-slate-700/50 rounded border border-white/5" />
                        </div>
                        <div className="flex-1 bg-slate-800/50 rounded flex flex-col gap-1 p-1">
                            <div className="h-1.5 w-8 bg-slate-700 rounded"></div>
                            <motion.div variants={{ hover: { scale: 1.05 } }} className="h-6 w-full bg-pink-500/20 rounded border border-pink-500/30" />
                        </div>
                     </div>
                 </motion.div>
             </motion.div>
          </motion.div>

          {/* Right Column: 3D UI Showcase */}
          <div className="relative h-[280px] sm:h-[400px] lg:h-[600px] w-full perspective-1000 mt-8 lg:mt-0">
              <MockInterface />
          </div>

      </div>

      {/* FEATURE SHOWCASE SECTIONS */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 space-y-32">
        {SHOWCASE_ITEMS.map((item, index) => (
            <motion.div 
                key={index}
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-24`}
            >
                {/* Text Side */}
                <div className="flex-1 space-y-6">
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-xs font-bold uppercase tracking-widest shadow-sm"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                        Feature {index + 1}
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight"
                    >
                        {item.title}
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="text-lg text-slate-400 leading-relaxed max-w-xl"
                    >
                        {item.description}
                    </motion.p>
                    {/* Cursive Annotation */}
                    {index % 2 === 0 && (
                        <div className="font-hand text-2xl text-cyan-200/50 rotate-1 mt-4">
                            ~ Elevate your workflow
                        </div>
                    )}
                </div>

                {/* Image Side */}
                <div className="flex-1 w-full relative">
                    {/* Decorative background glow */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br ${index % 2 === 0 ? 'from-cyan-500/20 to-blue-500/20' : 'from-emerald-500/20 to-teal-500/20'} blur-[80px] rounded-full -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-700`} />
                    
                    <motion.div 
                        whileHover={{ scale: 1.02, y: -5 }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                        className="relative group rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-500 flex flex-col"
                    >
                        {/* App Window Header */}
                        <div className="h-10 border-b border-white/10 bg-slate-800/50 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        {/* Image */}
                        <div className="relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />
                            <img 
                                src={item.image} 
                                alt={item.title} 
                                className="w-full h-auto max-h-[250px] sm:max-h-none object-cover sm:object-contain transform group-hover:scale-105 transition-transform duration-700"
                                loading="lazy"
                            />
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        ))}
      </div>
      
      {/* Premium Bento Grid Features */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-32 relative z-10">
        <div className="text-center mb-16">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
            >
                <Layout size={12} /> The Ecosystem
            </motion.div>
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight"
            >
                Everything you need.<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Nothing you don't.</span>
            </motion.h2>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-lg text-slate-400 max-w-2xl mx-auto"
            >
                A carefully curated suite of tools designed to eliminate distractions, build unbreakable habits, and amplify your cognitive output.
            </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Large Card 1 */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-2 p-6 md:p-8 lg:p-10 bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-white/10 hover:border-cyan-500/30 transition-all group overflow-hidden relative"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full group-hover:bg-cyan-500/20 transition-colors duration-700" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform duration-500"><Timer size={28} /></div>
                        <h4 className="text-2xl md:text-3xl text-white font-bold mb-4">Precision Focus Timer</h4>
                        <p className="text-slate-400 leading-relaxed max-w-md text-lg">Customizable Pomodoro intervals with deep work tracking. Enter flow state faster with our scientifically-backed timing sequences and immersive ambient sounds.</p>
                    </div>
                </div>
            </motion.div>

            {/* Small Card 1 */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-6 md:p-8 lg:p-10 bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-white/10 hover:border-emerald-500/30 transition-all group overflow-hidden relative"
            >
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full group-hover:bg-emerald-500/20 transition-colors duration-700" />
                <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-500"><BarChart2 size={28} /></div>
                    <h4 className="text-2xl text-white font-bold mb-4">Deep Analytics</h4>
                    <p className="text-slate-400 leading-relaxed">Visualize your productivity patterns, track subject mastery, and optimize your study schedule based on real data.</p>
                </div>
            </motion.div>

            {/* Small Card 2 */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-6 md:p-8 lg:p-10 bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-white/10 hover:border-amber-500/30 transition-all group overflow-hidden relative"
            >
                <div className="absolute top-0 left-0 w-48 h-48 bg-amber-500/10 blur-[60px] rounded-full group-hover:bg-amber-500/20 transition-colors duration-700" />
                <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition-transform duration-500"><Workflow size={28} /></div>
                    <h4 className="text-2xl text-white font-bold mb-4">Habit Forge</h4>
                    <p className="text-slate-400 leading-relaxed">Build unbreakable routines. Track daily habits, maintain streaks, and forge the discipline needed for top-tier performance.</p>
                </div>
            </motion.div>

            {/* Large Card 2 */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2 p-6 md:p-8 lg:p-10 bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-white/10 hover:border-pink-500/30 transition-all group overflow-hidden relative"
            >
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/10 blur-[80px] rounded-full group-hover:bg-pink-500/20 transition-colors duration-700" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                        <div className="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-400 mb-6 group-hover:scale-110 transition-transform duration-500"><Users size={28} /></div>
                        <h4 className="text-2xl md:text-3xl text-white font-bold mb-4">Study Together</h4>
                        <p className="text-slate-400 leading-relaxed max-w-md text-lg">Study with friends in real-time rooms. Collaborate on a shared whiteboard, sync your Pomodoro timers, and stay accountable together.</p>
                    </div>
                </div>
            </motion.div>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 border border-white/10 rounded-3xl p-8 md:p-12"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold uppercase tracking-widest mb-4">
              <Sparkles size={12} /> Built for Indian Students
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              India's most complete study companion
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Designed specifically for JEE, NEET, BITSAT and other competitive exam aspirants.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                emoji: '📚',
                title: 'Full JEE & NEET Syllabus',
                desc: 'Every chapter and topic pre-loaded. Track your progress topic by topic.',
                color: 'cyan'
              },
              {
                emoji: '👥',
                title: 'Study Rooms',
                desc: 'Study with friends in real-time. Synced Pomodoro timer and live chat.',
                color: 'purple'
              },
              {
                emoji: '🗺️',
                title: 'Smart Study Planner',
                desc: 'Auto-generate a day-by-day plan based on your syllabus completion.',
                color: 'emerald'
              },
              {
                emoji: '🎨',
                title: 'Collaborative Whiteboard',
                desc: 'Draw, annotate and explain concepts with friends in study rooms.',
                color: 'amber'
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-5 rounded-2xl bg-${item.color}-500/5 border border-${item.color}-500/15 hover:border-${item.color}-500/30 transition-colors`}
              >
                <div className="text-3xl mb-3">{item.emoji}</div>
                <div className="font-bold text-white text-sm mb-1">{item.title}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{item.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* How It Works Section */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-32 relative z-10">
          <div className="text-center mb-16">
              <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6"
              >
                  <Workflow size={12} /> The Process
              </motion.div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">How to master your workflow</h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">Three simple steps to transition from scattered attention to laser-focused execution.</p>
          </div>

          <div className="relative">
              {/* Connecting Line */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent -translate-y-1/2 z-0" />
              <div className="md:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent z-0" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                  {[
                      {
                          step: "01",
                          title: "Plan Your Attack",
                          desc: "Organize your tasks in the planner. Break down large projects into actionable, bite-sized chunks.",
                          icon: <Calendar size={24} />,
                          colorClass: "text-cyan-400",
                          bgClass: "bg-cyan-500/10",
                          borderClass: "border-cyan-500/30",
                          hoverBgClass: "group-hover:bg-cyan-500/10"
                      },
                      {
                          step: "02",
                          title: "Enter the Zone",
                          desc: "Start the Pomodoro timer. The interface fades away, leaving only your task and the ticking clock.",
                          icon: <Timer size={24} />,
                          colorClass: "text-blue-400",
                          bgClass: "bg-blue-500/10",
                          borderClass: "border-blue-500/30",
                          hoverBgClass: "group-hover:bg-blue-500/10"
                      },
                      {
                          step: "03",
                          title: "Review & Adapt",
                          desc: "Check your analytics. See where your time went, adjust your habits, and prepare for the next session.",
                          icon: <BarChart2 size={24} />,
                          colorClass: "text-emerald-400",
                          bgClass: "bg-emerald-500/10",
                          borderClass: "border-emerald-500/30",
                          hoverBgClass: "group-hover:bg-emerald-500/10"
                      }
                  ].map((item, i) => (
                      <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.2 }}
                          className="flex flex-col items-center text-center relative group pl-8 md:pl-0"
                      >
                          <div className={`w-20 h-20 rounded-2xl bg-slate-900 border ${item.borderClass} flex items-center justify-center ${item.colorClass} mb-6 relative z-10 group-hover:scale-110 ${item.hoverBgClass} transition-all duration-500 shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                              {item.icon}
                              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                                  {item.step}
                              </div>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                          <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                      </motion.div>
                  ))}
              </div>
          </div>
      </div>

      {/* Mobile Experience Section */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-32 relative z-10">
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[3rem] p-8 md:p-16 overflow-hidden relative flex flex-col md:flex-row items-center gap-12">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="flex-1 space-y-8 relative z-10">
                  <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-bold uppercase tracking-widest"
                  >
                      <Smartphone size={12} className="text-cyan-400" /> Cross-Platform
                  </motion.div>
                  <motion.h2 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight"
                  >
                      Your focus, <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">anywhere you go.</span>
                  </motion.h2>
                  <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                      className="text-lg text-slate-400 leading-relaxed max-w-md"
                  >
                      EkagraZone is built as a Progressive Web App (PWA). Install it directly to your home screen on iOS, Android, or Desktop. No app store required.
                  </motion.p>
                  
                  <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-col sm:flex-row gap-4 pt-4"
                  >
                      <div className="flex items-center gap-3 text-slate-300 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                          <Laptop size={20} className="text-cyan-400" />
                          <span className="font-medium">Desktop</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                          <Smartphone size={20} className="text-blue-400" />
                          <span className="font-medium">Mobile</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-300 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                          <Cloud size={20} className="text-emerald-400" />
                          <span className="font-medium">Cloud Sync</span>
                      </div>
                  </motion.div>
              </div>

              {/* Mobile Mockup */}
              <motion.div 
                  initial={{ opacity: 0, y: 50, rotateZ: -5 }}
                  whileInView={{ opacity: 1, y: 0, rotateZ: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="flex-1 relative z-10 flex justify-center w-full"
              >
                  <motion.div 
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-[280px] h-[580px] bg-slate-950 rounded-[3rem] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col"
                  >
                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                      
                      {/* Screen Content */}
                      <div className="flex-1 bg-[#050511] p-6 pt-12 flex flex-col relative">
                          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 to-transparent opacity-50" />
                          
                          <div className="flex justify-between items-center mb-8 relative z-10">
                              <div className="w-8 h-8 rounded-full bg-slate-800" />
                              <div className="w-8 h-8 rounded-full bg-slate-800" />
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                              <div className="w-48 h-48 rounded-full border-4 border-cyan-500/30 flex items-center justify-center relative mb-8">
                                  <div className="absolute inset-0 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                                  <span className="text-4xl font-mono font-bold text-white">25:00</span>
                              </div>
                              <div className="text-center">
                                  <h3 className="text-white font-bold text-lg mb-1">Deep Work</h3>
                                  <p className="text-cyan-400 text-sm">Session 1/4</p>
                              </div>
                          </div>
                          
                          <div className="h-16 bg-slate-900/80 rounded-2xl border border-white/10 mt-auto flex items-center justify-around px-4 relative z-10">
                              <div className="w-8 h-8 rounded-full bg-cyan-500/20" />
                              <div className="w-8 h-8 rounded-full bg-white/5" />
                              <div className="w-8 h-8 rounded-full bg-white/5" />
                              <div className="w-8 h-8 rounded-full bg-white/5" />
                          </div>
                      </div>
                  </motion.div>
                  {/* Decorative blur behind phone */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[500px] bg-cyan-500/20 blur-[60px] rounded-full -z-10" />
              </motion.div>
          </div>
      </div>

      {/* FAQ Section */}
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pb-24 relative z-10">
          <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
              {FAQS.map((faq, index) => (
                  <div key={index} className="bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
                      <button 
                          onClick={() => setOpenFaq(openFaq === index ? null : index)}
                          className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                      >
                          <span className="font-bold text-white text-lg">{faq.question}</span>
                          {openFaq === index ? <ChevronUp className="text-cyan-400 flex-shrink-0" /> : <ChevronDown className="text-slate-400 flex-shrink-0" />}
                      </button>
                      <AnimatePresence>
                          {openFaq === index && (
                              <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="px-6 pb-6 text-slate-400 leading-relaxed overflow-hidden"
                              >
                                  {faq.answer}
                              </motion.div>
                          )}
                      </AnimatePresence>
                  </div>
              ))}
          </div>
      </div>

      {/* Trust Signal: Privacy by Design */}
      <div className="w-full max-w-7xl mx-auto px-6 pb-24 relative z-10">
          <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto bg-slate-900/40 border border-emerald-500/20 rounded-3xl p-8 md:p-12 backdrop-blur-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                  <Shield size={12} /> Privacy by Design
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white">Your Focus, Protected.</h3>
              <p className="text-slate-400 leading-relaxed text-lg">
                  We believe your study habits are personal. Your data is encrypted and stored securely via Firebase. 
                  We never sell your study habits, session data, or personal information to third parties. 
                  EkagraZone is built to be a safe haven for your mind.
              </p>
          </div>
      </div>

      {/* Proudly Made in India Badge */}
      <div className="w-full flex justify-center pb-16 relative z-10">
          <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500/10 via-white/5 to-green-500/10 border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(255,153,51,0.1)]"
          >
              <span className="text-2xl">🇮🇳</span>
              <span className="text-slate-300 font-medium tracking-wide">Proudly crafted in <span className="text-white font-bold">India</span> for the world</span>
          </motion.div>
      </div>

      {/* Footer */}
      <Footer 
          onOpenPrivacy={() => setShowPrivacy(true)} 
          onOpenTerms={() => setShowTerms(true)} 
      />

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl backdrop-blur-xl">
            <h3 className="text-xl font-bold text-[#158af2] mb-4">Privacy Policy</h3>
            <div className="space-y-4 text-sm text-slate-300">
              <p>We collect email addresses only for account authentication and leaderboard ranking. We do not sell user data to third parties.</p>
            </div>
            <button 
              onClick={() => setShowPrivacy(false)}
              className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl backdrop-blur-xl">
            <h3 className="text-xl font-bold text-[#158af2] mb-4">Terms of Service</h3>
            <div className="space-y-4 text-sm text-slate-300">
              <p>EkagraZone is a productivity tool provided "as is". Users agree not to use bots or scripts to manipulate the leaderboard.</p>
              <p>We reserve the right to remove accounts that engage in unfair play or harassment in the community Arena.</p>
            </div>
            <button 
              onClick={() => setShowTerms(false)}
              className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Mock UI Components for the "Screenshot" effect ---

const MockInterface = () => {
    return (
        <motion.div 
            initial={{ opacity: 0, x: 100, rotateY: -20 }}
            animate={{ opacity: 1, x: 0, rotateY: -10 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="relative w-full h-full transform hover:rotate-y-[-5deg] hover:rotate-x-[2deg] transition-transform duration-700 ease-out preserve-3d"
        >
            
            {/* Main Window */}
            <div className="absolute inset-0 bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                {/* Window Controls */}
                <div className="h-12 border-b border-white/5 bg-slate-900/50 flex items-center px-6 gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar Mock */}
                    <div className="w-20 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-slate-900/30">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400"><Layout size={20} /></div>
                        <div className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500"><Timer size={20} /></div>
                        <div className="w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center text-slate-500"><BarChart2 size={20} /></div>
                        <div className="mt-auto w-8 h-8 rounded-full bg-slate-800" />
                    </div>

                    {/* Dashboard Content Mock */}
                    <div className="flex-1 p-8 bg-slate-950/50 relative">
                        <div className="mb-8">
                            <div className="h-8 w-48 bg-slate-800 rounded-lg mb-2" />
                            <div className="h-4 w-32 bg-slate-800/50 rounded-lg" />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Big Timer Card */}
                            <div className="col-span-2 bg-slate-900/60 border border-white/5 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between">
                                <div>
                                    <div className="h-4 w-24 bg-cyan-500/20 rounded-full mb-4" />
                                    <div className="text-5xl font-mono font-bold text-white tracking-tighter">24:59</div>
                                    <div className="flex gap-2 mt-4">
                                        <div className="h-10 w-24 bg-cyan-600 rounded-xl" />
                                        <div className="h-10 w-10 bg-white/10 rounded-xl" />
                                    </div>
                                </div>
                                <div className="w-32 h-32 rounded-full border-4 border-cyan-500/30 relative flex items-center justify-center">
                                    <div className="w-24 h-24 rounded-full bg-cyan-500/10 animate-pulse" />
                                </div>
                            </div>

                            {/* Stat Card 1 */}
                            <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/20" />
                                    <div className="text-xs text-emerald-400 font-bold">+12%</div>
                                </div>
                                <div className="h-8 w-20 bg-white/10 rounded-lg mb-1" />
                                <div className="h-3 w-12 bg-white/5 rounded-lg" />
                            </div>

                            {/* Stat Card 2 */}
                            <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-8 w-8 rounded-lg bg-orange-500/20" />
                                    <div className="text-xs text-orange-400 font-bold">5 Day</div>
                                </div>
                                <div className="h-8 w-12 bg-white/10 rounded-lg mb-1" />
                                <div className="h-3 w-24 bg-white/5 rounded-lg" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Elements for Depth */}
            
            {/* Floating Task List */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: [0, -15, 0], opacity: 1 }}
                transition={{ 
                    opacity: { delay: 0.8, duration: 0.5 },
                    y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                }}
                className="absolute -right-12 top-20 w-64 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl transform rotate-y-12 rotate-z-2"
            >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <span className="text-xs font-bold text-slate-300 uppercase">Today's Tasks</span>
                    <span className="text-xs text-slate-500">3/5</span>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 opacity-50">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <div className="h-2 w-32 bg-slate-700 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3 opacity-50">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <div className="h-2 w-24 bg-slate-700 rounded-full" />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-cyan-500" />
                        <div className="h-2 w-28 bg-cyan-400/50 rounded-full" />
                    </div>
                </div>
            </motion.div>

            {/* Floating Notification */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1, y: [0, -10, 0] }}
                transition={{ 
                    opacity: { delay: 1.1, duration: 0.5 },
                    x: { delay: 1.1, duration: 0.5 },
                    y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }
                }}
                className="absolute -left-8 bottom-32 w-auto flex items-center gap-3 bg-slate-800/90 backdrop-blur-xl border border-emerald-500/20 p-3 pr-6 rounded-full shadow-2xl transform -rotate-y-12 -rotate-z-2"
            >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Zap size={18} fill="currentColor" />
                </div>
                <div>
                    <div className="text-xs font-bold text-white">Focus Streak!</div>
                    <div className="text-[10px] text-emerald-400">You hit 4 hours today.</div>
                </div>
            </motion.div>

        </motion.div>
    );
}
