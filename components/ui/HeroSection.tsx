import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

export const HeroSection: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          // Calculate how far the component is from the top of the viewport
          const scrollProgress = Math.max(0, Math.min(1, -rect.top / (window.innerHeight || 1)));
          setScrollY(scrollProgress);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate rotation based on scroll (e.g., from 20deg down to 0deg)
  const rotateX = 20 - scrollY * 20;
  const scale = 0.9 + scrollY * 0.1;
  const translateY = scrollY * -50;

  return (
    <div ref={containerRef} className="relative w-full max-w-6xl mx-auto mt-24 mb-32 perspective-[2000px] z-20 px-4">
      <motion.div
        style={{
          rotateX: `${rotateX}deg`,
          scale: scale,
          y: translateY,
          transformStyle: 'preserve-3d',
        }}
        className="w-full rounded-2xl border border-indigo-500/20 bg-[#0a0a1a]/80 backdrop-blur-md shadow-2xl shadow-indigo-500/20 overflow-hidden"
      >
        {/* Browser/App Chrome */}
        <div className="px-4 py-3 border-b border-indigo-500/20 bg-[#050511]/90 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
          <div className="ml-4 h-4 w-48 bg-indigo-500/10 rounded-md" />
        </div>
        
        {/* Mockup Dashboard Content */}
        <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 bg-gradient-to-br from-[#0a0a1a] to-[#11112a]">
          
          {/* Left Column: Heatmap & Stats */}
          <div className="md:col-span-2 space-y-8">
            {/* Header Mockup */}
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-indigo-500/20 rounded-lg" />
                <div className="h-4 w-32 bg-slate-700/50 rounded-md" />
              </div>
              <div className="h-10 w-32 bg-indigo-600/30 rounded-full border border-indigo-500/30" />
            </div>

            {/* Heatmap Mockup */}
            <div className="p-6 rounded-xl border border-indigo-500/10 bg-[#050511]/50 space-y-4">
              <div className="h-5 w-32 bg-slate-700/50 rounded-md" />
              <div className="grid grid-cols-12 gap-2">
                {Array.from({ length: 60 }).map((_, i) => {
                  const intensity = Math.random();
                  let colorClass = 'bg-slate-800/50';
                  if (intensity > 0.8) colorClass = 'bg-indigo-400';
                  else if (intensity > 0.5) colorClass = 'bg-indigo-500/70';
                  else if (intensity > 0.3) colorClass = 'bg-indigo-500/40';
                  
                  return (
                    <div
                      key={i}
                      className={`h-6 rounded-sm ${colorClass}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Chart Mockup */}
            <div className="flex gap-4">
              <div className="flex-1 p-6 rounded-xl border border-indigo-500/10 bg-[#050511]/50 h-32 flex items-end gap-2">
                {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                  <div key={i} className="flex-1 bg-indigo-500/40 rounded-t-sm" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="flex-1 p-6 rounded-xl border border-indigo-500/10 bg-[#050511]/50 h-32 flex items-center justify-center">
                 <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 border-r-indigo-400" />
              </div>
            </div>
          </div>

          {/* Right Column: Progress & Tasks */}
          <div className="md:col-span-1 space-y-6">
            {/* Level/XP Mockup */}
            <div className="p-6 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                  <div className="w-6 h-6 rounded-full bg-violet-400" />
                </div>
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-violet-400/50 rounded-md" />
                  <div className="h-3 w-16 bg-slate-700/50 rounded-md" />
                </div>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 w-[70%]" />
              </div>
            </div>

            {/* Tasks Mockup */}
            <div className="p-6 rounded-xl border border-indigo-500/10 bg-[#050511]/50 space-y-4">
              <div className="h-5 w-24 bg-slate-700/50 rounded-md mb-6" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border ${i === 1 ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`} />
                  <div className={`h-4 w-full rounded-md ${i === 1 ? 'bg-indigo-500/30' : 'bg-slate-700/50'}`} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
};
