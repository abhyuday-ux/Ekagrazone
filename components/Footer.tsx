import React from 'react';
import { Shield, Heart } from 'lucide-react';
import { EkagraLogo } from './EkagraLogo';

interface FooterProps {
    onOpenPrivacy: () => void;
    onOpenTerms: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenPrivacy, onOpenTerms }) => {
    return (
        <footer className="w-full bg-[#050511] border-t border-white/5 pt-20 pb-12 relative z-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
                    {/* Column 1: About EkagraZone */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-2 opacity-90 mb-4">
                            <EkagraLogo className="w-8 h-8" />
                            <span className="font-bold text-white tracking-wide text-xl">EKAGRAZONE</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed text-sm max-w-md">
                            EkagraZone is a holistic ecosystem designed for students, professionals, and lifelong learners to reclaim their attention in a world of digital distractions. 
                            We combine the science of deep work with gamified productivity to help you build sustainable habits and achieve your peak potential.
                        </p>
                        <p className="text-slate-400 leading-relaxed text-sm max-w-md">
                            Our mission is to empower a global community of focused individuals. Whether you're preparing for competitive exams or mastering a new skill, EkagraZone provides the tools, environment, and accountability you need to succeed.
                        </p>
                    </div>

                    {/* Column 2: Support & Contact */}
                    <div className="space-y-6">
                        <h4 className="text-white font-bold text-sm uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Support</h4>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li className="flex items-start gap-3">
                                <span className="text-indigo-400 font-bold min-w-[60px]">Email:</span>
                                <a href="mailto:ekagrazone.help@gmail.com" className="hover:text-white transition-colors">ekagrazone.help@gmail.com</a>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-indigo-400 font-bold min-w-[60px]">Hours:</span>
                                <span>Mon-Fri, 9 AM - 6 PM IST</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-indigo-400 font-bold min-w-[60px]">Location:</span>
                                <span>India | Serving a Global Community</span>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Data Integrity & Legal */}
                    <div className="space-y-6">
                        <h4 className="text-white font-bold text-sm uppercase tracking-widest border-b border-white/10 pb-2 mb-4">Trust & Legal</h4>
                        <div className="space-y-4 text-sm text-slate-400">
                            <p className="text-xs leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                <strong className="text-emerald-400 block mb-1">Data Integrity:</strong>
                                Your data is encrypted and stored securely via Firebase. We adhere to strict privacy standards and never sell your personal information or study habits to third parties.
                            </p>
                            <div className="flex flex-col gap-2 pt-2">
                                <button onClick={onOpenPrivacy} className="text-left hover:text-indigo-400 transition-colors flex items-center gap-2">
                                    <Shield size={14} /> Privacy Policy
                                </button>
                                <button onClick={onOpenTerms} className="text-left hover:text-indigo-400 transition-colors">
                                    Terms of Service
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                    <p>© 2026 EkagraZone. All rights reserved.</p>
                    <div className="flex items-center gap-1.5">
                        <span>Made with</span>
                        <Heart size={10} className="fill-rose-500 text-rose-500 animate-pulse" />
                        <span>in India 🇮🇳</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};
