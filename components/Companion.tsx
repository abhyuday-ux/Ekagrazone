import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimerStatus } from '../types';

interface CompanionProps {
  timerStatus: TimerStatus;
  isComplete: boolean;
  currentTask?: string;
}

type Edge = 'top' | 'right' | 'bottom' | 'left';
type Mood = 'idle' | 'amaze' | 'focus' | 'scary' | 'question';

export const Companion: React.FC<CompanionProps> = ({ timerStatus, isComplete, currentTask }) => {
  const [edge, setEdge] = useState<Edge>('bottom');
  const [position, setPosition] = useState(50);
  const [mood, setMood] = useState<Mood>('idle');
  const [name, setName] = useState(localStorage.getItem('rocky_name') || '');
  const [askingName, setAskingName] = useState(!localStorage.getItem('rocky_name'));
  const [tempName, setTempName] = useState('');
  const [message, setMessage] = useState('');
  
  const audioCtx = useRef<AudioContext | null>(null);
  const prevStatus = useRef(timerStatus);
  const prevTask = useRef(currentTask);

  useEffect(() => {
    if (!audioCtx.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) audioCtx.current = new Ctx();
    }
  }, []);

  const playTone = (freq: number, start: number, dur: number, type: OscillatorType = 'sine') => {
    if (!audioCtx.current) return;
    const ctx = audioCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur);
  };

  const playAudio = (m: Mood) => {
    if (!audioCtx.current) return;
    if (audioCtx.current.state === 'suspended') audioCtx.current.resume();
    const now = audioCtx.current.currentTime;
    if (m === 'amaze') {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => playTone(f, now + i*0.1, 0.2));
    } else if (m === 'focus') {
      [329.63, 329.63, 329.63].forEach((f, i) => playTone(f, now + i*0.3, 0.1));
    } else if (m === 'scary') {
      playTone(130.81, now, 0.5, 'sawtooth');
      playTone(138.59, now, 0.5, 'sawtooth');
    } else if (m === 'question') {
      playTone(392.00, now, 0.2);
      playTone(523.25, now + 0.2, 0.3);
    } else {
      playTone(800 + Math.random()*200, now, 0.1);
    }
  };

  const trigger = (m: Mood, msg: string, e?: Edge, pos?: number) => {
    setMood(m);
    setMessage(msg);
    if (e) setEdge(e);
    if (pos !== undefined) setPosition(pos);
    playAudio(m);
    setTimeout(() => setMessage(''), 4000);
    setTimeout(() => setMood('idle'), 5000);
  };

  useEffect(() => {
    if (askingName) {
      trigger('question', 'Name?', 'bottom', 50);
    }
  }, [askingName]);

  useEffect(() => {
    if (timerStatus === 'running' && prevStatus.current !== 'running') {
      trigger('focus', 'Focus', 'top', 50);
    } else if (isComplete) {
      trigger('amaze', 'Amaze!', 'bottom', 50);
    } else if (timerStatus === 'paused' && prevStatus.current === 'running') {
      trigger('scary', 'Scary', 'bottom', 50);
    }
    prevStatus.current = timerStatus;
  }, [timerStatus, isComplete]);

  useEffect(() => {
    if (currentTask && currentTask !== prevTask.current) {
      trigger('focus', 'Work', 'left', 50);
    }
    prevTask.current = currentTask;
  }, [currentTask]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mood === 'idle' && !askingName && timerStatus !== 'running') {
        const edges: Edge[] = ['top', 'right', 'bottom', 'left'];
        setEdge(edges[Math.floor(Math.random() * edges.length)]);
        setPosition(20 + Math.random() * 60);
        playAudio('idle');
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [mood, askingName, timerStatus]);

  const saveName = () => {
    if (tempName) {
      localStorage.setItem('rocky_name', tempName);
      setName(tempName);
      setAskingName(false);
      trigger('amaze', 'Amaze!', 'top', 50);
    }
  };

  const getRotation = () => {
    switch (edge) {
      case 'top': return 180;
      case 'right': return -90;
      case 'bottom': return 0;
      case 'left': return 90;
    }
  };

  const getPositionStyle = () => {
    const style: any = {};
    if (edge === 'top') { style.top = 0; style.left = `${position}%`; style.transform = 'translateX(-50%)'; }
    if (edge === 'bottom') { style.bottom = 0; style.left = `${position}%`; style.transform = 'translateX(-50%)'; }
    if (edge === 'left') { style.left = 0; style.top = `${position}%`; style.transform = 'translateY(-50%)'; }
    if (edge === 'right') { style.right = 0; style.top = `${position}%`; style.transform = 'translateY(-50%)'; }
    return style;
  };

  const getEyePath = (side: 'left' | 'right') => {
    if (mood === 'amaze') return "M 0 10 Q 20 -10 40 10 L 40 40 L 0 40 Z";
    if (mood === 'focus') return "M 0 15 L 40 15 L 40 25 L 0 25 Z";
    if (mood === 'scary') return side === 'left' ? "M 0 10 L 40 20 L 40 40 L 0 40 Z" : "M 0 20 L 40 10 L 40 40 L 0 40 Z";
    if (mood === 'question') return side === 'left' ? "M 0 5 Q 20 -5 40 5 L 40 40 L 0 40 Z" : "M 0 20 L 40 20 L 40 40 L 0 40 Z";
    return "M 0 5 Q 20 0 40 5 L 40 35 Q 20 40 0 35 Z";
  };

  return (
    <motion.div
      layout
      className="fixed z-[100] flex flex-col items-center justify-end"
      style={getPositionStyle()}
      animate={{ rotate: getRotation() }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      drag={edge === 'top' || edge === 'bottom' ? 'x' : 'y'}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={(e, info) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (edge === 'top' || edge === 'bottom') {
          setPosition(Math.max(10, Math.min(90, position + (info.offset.x / w) * 100)));
        } else {
          setPosition(Math.max(10, Math.min(90, position + (info.offset.y / h) * 100)));
        }
      }}
    >
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 bg-black/80 text-[#00FF7F] font-mono text-xs px-3 py-1 rounded border border-[#00FF7F]/30 whitespace-nowrap"
            style={{ transform: `rotate(${-getRotation()}deg)` }}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {askingName && (
        <div className="mb-4 flex gap-2" style={{ transform: `rotate(${-getRotation()}deg)` }}>
          <input
            className="bg-black border border-[#00FF7F] text-[#00FF7F] px-2 py-1 text-xs rounded outline-none"
            value={tempName}
            onChange={e => setTempName(e.target.value)}
            placeholder="Name?"
          />
          <button onClick={saveName} className="bg-[#00FF7F] text-black px-2 py-1 text-xs rounded font-bold">OK</button>
        </div>
      )}

      <motion.div
        className="relative flex items-center justify-center gap-2"
        style={{ width: 140, height: 40 }}
        animate={{
          scaleX: mood === 'idle' ? [1, 1.05, 1] : 1,
          scaleY: mood === 'idle' ? [1, 0.95, 1] : 1
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <svg className="absolute inset-0 w-full h-full drop-shadow-[0_-5px_15px_rgba(0,255,127,0.2)]" preserveAspectRatio="none" viewBox="0 0 140 40">
          <path d="M 0 40 C 15 40, 15 0, 30 0 L 110 0 C 125 0, 125 40, 140 40 Z" fill="black" />
        </svg>
        <div className="relative z-10 flex gap-4 mt-2">
          <svg width="30" height="30" viewBox="0 0 40 40">
            <motion.path
              d={getEyePath('left')}
              fill="#00FF7F"
              animate={{ d: getEyePath('left') }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ filter: 'drop-shadow(0 0 8px #00FF7F)' }}
            />
          </svg>
          <svg width="30" height="30" viewBox="0 0 40 40">
            <motion.path
              d={getEyePath('right')}
              fill="#00FF7F"
              animate={{ d: getEyePath('right') }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{ filter: 'drop-shadow(0 0 8px #00FF7F)' }}
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
};
