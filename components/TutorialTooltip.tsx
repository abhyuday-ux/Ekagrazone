import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TutorialTooltipProps {
  targetId: string;
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  position?: 'top'|'bottom'|'left'|'right';
}

const TutorialTooltip: React.FC<TutorialTooltipProps> = ({
  targetId, title, description, step, 
  totalSteps, onNext, onSkip, position = 'bottom'
}) => {
  const [rect, setRect] = useState<DOMRect|null>(null);
  
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    
    // Add glow to target element
    el.style.boxShadow = `0 0 0 3px rgba(6,182,212,0.8),
      0 0 20px rgba(6,182,212,0.4),
      0 0 40px rgba(6,182,212,0.2)`;
    el.style.borderRadius = '12px';
    el.style.position = 'relative';
    el.style.zIndex = '1000';
    
    const updateRect = () => setRect(el.getBoundingClientRect());
    updateRect();
    window.addEventListener('resize', updateRect);
    
    return () => {
      // Remove glow on cleanup
      el.style.boxShadow = '';
      el.style.zIndex = '';
      window.removeEventListener('resize', updateRect);
    };
  }, [targetId]);

  if (!rect) return null;

  // Calculate tooltip position
  const tooltipStyle: React.CSSProperties = {};
  const OFFSET = 16;
  
  if (position === 'bottom' || 
    rect.bottom + 200 < window.innerHeight) {
    tooltipStyle.top = rect.bottom + OFFSET;
    tooltipStyle.left = Math.max(16, 
      rect.left + rect.width/2 - 160);
  } else {
    tooltipStyle.bottom = window.innerHeight - rect.top + OFFSET;
    tooltipStyle.left = Math.max(16,
      rect.left + rect.width/2 - 160);
  }

  return (
    <>
      {/* Dark overlay with hole */}
      <div 
        className="fixed inset-0 z-[999] bg-black/60 
          backdrop-blur-[2px]"
        style={{
          // Punch hole around target element
          WebkitMaskImage: `radial-gradient(
            ellipse ${rect.width + 24}px ${rect.height + 24}px 
            at ${rect.left + rect.width/2}px 
            ${rect.top + rect.height/2}px, 
            transparent 100%, black 100%
          )`,
          maskImage: `radial-gradient(
            ellipse ${rect.width + 24}px ${rect.height + 24}px 
            at ${rect.left + rect.width/2}px 
            ${rect.top + rect.height/2}px, 
            transparent 100%, black 100%
          )`
        }}
        onClick={onSkip}
      />

      {/* Tooltip card */}
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.95 }}
        style={{
          ...tooltipStyle,
          position: 'fixed',
          width: '320px',
          zIndex: 1000
        }}
        className="bg-slate-900 border border-cyan-500/30 
          rounded-2xl p-4 shadow-2xl 
          shadow-cyan-500/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-cyan-500 
              flex items-center justify-center text-[10px] 
              font-bold text-white">
              {step}
            </div>
            <span className="text-sm font-bold text-white">
              {title}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {step}/{totalSteps}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          {description}
        </p>

        {/* Progress dots */}
        <div className="flex gap-1 mb-3">
          {Array.from({length: totalSteps}).map((_,i) => (
            <div key={i}
              className={`h-1 flex-1 rounded-full transition-all
                ${i < step ? 'bg-cyan-500' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 py-2 rounded-xl text-xs 
              text-slate-500 hover:text-slate-300 
              bg-white/5 hover:bg-white/10 
              transition-colors font-medium"
          >
            Skip all
          </button>
          <button
            onClick={onNext}
            className="flex-1 py-2 rounded-xl text-xs 
              font-bold text-white bg-cyan-500 
              hover:bg-cyan-400 transition-colors
              flex items-center justify-center gap-1"
          >
            {step === totalSteps ? 'Done ✓' : 'Next →'}
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default TutorialTooltip;
