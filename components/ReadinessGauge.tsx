import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { Exam } from '../types';
import {
  ReadinessBreakdown,
  getReadinessColor,
  getReadinessLabel,
} from '../utils/readinessScore';

interface ReadinessGaugeProps {
  exam: Exam;
  breakdown: ReadinessBreakdown;
  size?: 'sm' | 'md' | 'lg'; // sm=dashboard, lg=exam page
  showBreakdown?: boolean; // show detail bars
  onInfoClick?: () => void;
}

export const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({
  exam,
  breakdown,
  size = 'md',
  showBreakdown = false,
  onInfoClick,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  const radius = size === 'lg' ? 70 : size === 'md' ? 55 : 40;
  const strokeWidth = size === 'lg' ? 10 : 8;
  const circumference = Math.PI * radius; // semi-circle
  const strokeDashoffset =
    circumference - (breakdown.total / 100) * circumference;
  const color = getReadinessColor(breakdown.total);
  const svgSize = (radius + strokeWidth) * 2;

  const handleInfoClick = () => {
    if (onInfoClick) {
      onInfoClick();
    } else {
      setShowInfo(true);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={svgSize}
          height={svgSize / 2 + strokeWidth}
          viewBox={`0 0 ${svgSize} ${svgSize / 2 + strokeWidth}`}
        >
          {/* Background arc */}
          <path
            d={`M ${strokeWidth} ${radius + strokeWidth} 
                A ${radius} ${radius} 0 0 1 
                ${svgSize - strokeWidth} ${radius + strokeWidth}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Colored progress arc */}
          <motion.path
            d={`M ${strokeWidth} ${radius + strokeWidth} 
                A ${radius} ${radius} 0 0 1 
                ${svgSize - strokeWidth} ${radius + strokeWidth}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
          {/* Score text in center */}
          <text
            x={svgSize / 2}
            y={radius + strokeWidth - 4}
            textAnchor="middle"
            fill="white"
            fontSize={size === 'lg' ? 28 : size === 'md' ? 22 : 16}
            fontWeight="900"
            fontFamily="JetBrains Mono, monospace"
          >
            {breakdown.total}%
          </text>
          <text
            x={svgSize / 2}
            y={radius + strokeWidth + (size === 'lg' ? 18 : 14)}
            textAnchor="middle"
            fill={color}
            fontSize={size === 'lg' ? 11 : 9}
            fontWeight="700"
            fontFamily="Inter, sans-serif"
          >
            {getReadinessLabel(breakdown.total)}
          </text>
        </svg>

        {size === 'lg' && (
          <button
            onClick={handleInfoClick}
            className="absolute -top-2 -right-2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Info size={14} />
          </button>
        )}
      </div>

      {showBreakdown && (
        <div className="w-full mt-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5">
              Readiness Breakdown
            </span>
            {size !== 'lg' && (
              <button
                onClick={handleInfoClick}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Info size={14} />
              </button>
            )}
          </div>
          {[
            {
              label: 'Syllabus',
              value: breakdown.syllabusPercent,
              score: breakdown.syllabusScore,
              max: 40,
              icon: '📚',
              desc: 'Topics completed in exam subjects',
            },
            {
              label: 'Study Time',
              value: breakdown.studyTimePercent,
              score: breakdown.studyTimeScore,
              max: 25,
              icon: '⏱',
              desc: 'Hours studied in last 14 days',
            },
            {
              label: 'Consistency',
              value: breakdown.consistencyPercent,
              score: breakdown.consistencyScore,
              max: 20,
              icon: '🔥',
              desc: 'Days studied in last 14 days',
            },
            {
              label: 'Time Buffer',
              value: breakdown.timeBufferPercent,
              score: breakdown.timeBufferScore,
              max: 15,
              icon: '📅',
              desc: `${breakdown.daysRemaining} days until exam`,
            },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs font-medium text-slate-300">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">
                    {item.desc}
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {Math.round(item.score)}/{item.max}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    background: getReadinessColor(item.value),
                    boxShadow: `0 0 6px ${getReadinessColor(item.value)}60`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold text-white mb-1">
                How Readiness Score Works
              </h3>
              <p className="text-slate-400 text-xs mb-4">
                Your score is calculated from 4 components:
              </p>
              {[
                {
                  label: 'Syllabus Completion',
                  weight: '40%',
                  desc: 'Topics marked done / total topics in exam subjects',
                },
                {
                  label: 'Study Time',
                  weight: '25%',
                  desc: 'Hours studied on exam subjects in last 14 days vs your daily target',
                },
                {
                  label: 'Consistency',
                  weight: '20%',
                  desc: 'Number of unique days you studied in the last 14 days',
                },
                {
                  label: 'Time Buffer',
                  weight: '15%',
                  desc: 'Days remaining until exam. More time = higher score',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex gap-3 py-2.5 border-b border-white/5 last:border-0"
                >
                  <div className="text-cyan-400 font-mono font-bold text-sm w-10 flex-shrink-0 mt-0.5">
                    {item.weight}
                  </div>
                  <div>
                    <div className="text-white text-xs font-bold mb-0.5">
                      {item.label}
                    </div>
                    <div className="text-slate-500 text-[11px] leading-relaxed">
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => setShowInfo(false)}
                className="w-full mt-4 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
