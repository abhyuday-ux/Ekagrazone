import React from 'react';
import { Brain, Clock, Trophy, Zap, Activity, Layers } from 'lucide-react';

export const ScienceSection: React.FC = () => {
    return (
        <section className="w-full max-w-7xl mx-auto px-6 py-24 relative z-10">
            {/* Section Header */}
            <div className="text-center mb-20">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
                    <Brain size={14} /> Methodology
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
                    The Neuroscience of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Deep Work</span>
                </h2>
                <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
                    EkagraZone isn't just a timer; it's a cognitive framework designed to align with your brain's natural rhythms. 
                    By leveraging principles from behavioral psychology and neuroscience, we help you bypass resistance and enter a state of peak performance.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* 1. The Pomodoro Protocol */}
                <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-slate-900/60 transition-colors group">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                        <Clock size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">The Pomodoro Protocol</h3>
                    <div className="space-y-4 text-slate-400 leading-relaxed">
                        <p>
                            Cognitive fatigue is the enemy of productivity. The human brain operates best in ultradian rhythms—cycles of high-frequency activity followed by rest. 
                            EkagraZone utilizes the scientifically validated <strong>25/5 minute split</strong> (and customizable intervals) to synchronize with these rhythms.
                        </p>
                        <p>
                            By compartmentalizing work into focused sprints, we prevent the buildup of "attention residue"—a phenomenon where your focus remains stuck on a previous task. 
                            The mandatory breaks allow the <strong>Default Mode Network (DMN)</strong> of your brain to activate, facilitating subconscious problem-solving and memory consolidation. 
                            This structure transforms "grinding" into a sustainable, rhythmic flow of output.
                        </p>
                    </div>
                </div>

                {/* 2. Achieving Flow State */}
                <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-slate-900/60 transition-colors group">
                    <div className="w-14 h-14 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-6 group-hover:scale-110 transition-transform">
                        <Zap size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Achieving Flow State</h3>
                    <div className="space-y-4 text-slate-400 leading-relaxed">
                        <p>
                            Flow state, often described as "being in the zone," is a neurological state where the prefrontal cortex (responsible for self-monitoring) downregulates, leading to a loss of self-consciousness and a 
                            heightened sense of agency. EkagraZone is engineered to trigger this state through <strong>environmental cues</strong>.
                        </p>
                        <p>
                            Our "Zen Mode" eliminates visual noise, reducing the cognitive load required to filter out distractions. 
                            Coupled with binaural beats and ambient soundscapes, we lower your brainwave frequency from a scattered Beta state to a focused Alpha or Theta state. 
                            This sensory deprivation of non-essential stimuli allows your brain to allocate 100% of its processing power to the task at hand, resulting in work that is both faster and higher quality.
                        </p>
                    </div>
                </div>

                {/* 3. Gamified Neuroplasticity */}
                <div className="bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-3xl p-8 hover:bg-slate-900/60 transition-colors group">
                    <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 mb-6 group-hover:scale-110 transition-transform">
                        <Trophy size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Gamified Neuroplasticity</h3>
                    <div className="space-y-4 text-slate-400 leading-relaxed">
                        <p>
                            Building a habit requires a feedback loop: Cue, Routine, Reward. Traditional study methods often lack the immediate "Reward" phase, leading to motivation drop-off. 
                            EkagraZone hacks this loop using <strong>Gamified Neuroplasticity</strong>.
                        </p>
                        <p>
                            Every completed session awards XP (Experience Points), triggering a micro-release of dopamine—the neurotransmitter associated with motivation and learning. 
                            By tying productivity to a leveling system and global leaderboards, we leverage <strong>Social Accountability</strong> to reinforce positive behavior. 
                            Over time, this rewires your brain to associate deep work not with pain, but with progress and status, effectively "addicting" you to your own success.
                        </p>
                    </div>
                </div>
            </div>

            {/* Additional Context Strip */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-6 flex items-start gap-4">
                    <Activity className="text-indigo-400 shrink-0 mt-1" size={24} />
                    <div>
                        <h4 className="text-white font-bold mb-2">The Cost of Multitasking</h4>
                        <p className="text-sm text-slate-400">
                            Research shows that it takes an average of 23 minutes to regain focus after a distraction. 
                            EkagraZone's "Deep Focus" environment is built to protect you from these costly interruptions, saving you hours of lost time every week.
                        </p>
                    </div>
                </div>
                <div className="bg-violet-900/20 border border-violet-500/20 rounded-2xl p-6 flex items-start gap-4">
                    <Layers className="text-violet-400 shrink-0 mt-1" size={24} />
                    <div>
                        <h4 className="text-white font-bold mb-2">Habit Stacking</h4>
                        <p className="text-sm text-slate-400">
                            We encourage "Habit Stacking"—pairing your study sessions with our built-in journaling and tracking tools. 
                            This creates a robust neural pathway that makes starting work automatic rather than a willpower struggle.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
