
import React, { useEffect, useState, useRef } from 'react';
import { TimerStatus, TimerMode, isHexColor, CustomSound, TimerDurations, DEFAULT_DURATIONS, Subject } from '../types';
import { Play, Pause, Square, Timer, Hourglass, CheckCircle2, Coffee, Armchair, Settings2, Save, Music, Volume2, VolumeX, CloudRain, Waves, Trees, BookOpen, Plus, Trash2, Upload, Link as LinkIcon, X, Sun, Clock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { dbService } from '../services/db';
import { useSound, SoundType } from '../contexts/SoundContext';
import { usePerformance } from '../contexts/PerformanceContext';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';
import { ZenSubjectPanel } from './ZenSubjectPanel';

interface TimerDisplayProps {
  elapsedMs: number;
  status: TimerStatus;
  mode: TimerMode;
  subjectColor: string;
  todaySubjectTotal: number;
  durations: TimerDurations;
  onUpdateDurations: (newDurations: TimerDurations) => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onSetMode: (mode: TimerMode) => void;
  sidePanel?: React.ReactNode;
  isWallpaperMode?: boolean; 
  isOvertime?: boolean;
  subjects?: Subject[];
  currentSubjectId?: string;
  onSelectSubject?: (id: string) => void;
  dailyTotalMs?: number;
  targetHours?: number;
}

const FALLBACK_QUOTES = [
    "Focus on the step in front of you, not the whole staircase.",
    "The only way to do great work is to love what you do.",
    "It always seems impossible until it's done.",
    "Don't watch the clock; do what it does. Keep going.",
    "Success is the sum of small efforts, repeated day in and day out.",
    "Believe you can and you're halfway there.",
    "Your future is created by what you do today, not tomorrow."
];

export const TimerDisplay: React.FC<TimerDisplayProps> = React.memo(({
  elapsedMs,
  status,
  mode,
  subjectColor,
  todaySubjectTotal,
  durations,
  onUpdateDurations,
  onStart,
  onPause,
  onStop,
  onSetMode,
  sidePanel,
  isWallpaperMode = false,
  isOvertime = false,
  subjects = [],
  currentSubjectId = '',
  onSelectSubject = () => {},
  dailyTotalMs = 0,
  targetHours = 6
}) => {
  const { hasPremium } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [quote, setQuote] = useState<string>('');
  
  // Local edit state for duration form
  const [editDurations, setEditDurations] = useState<TimerDurations>(durations);
  
  // Custom Sound Add State
  const [isAddingSound, setIsAddingSound] = useState(false);
  const [newSoundName, setNewSoundName] = useState('');
  const [newSoundType, setNewSoundType] = useState<'url' | 'file'>('url');
  const [newSoundUrl, setNewSoundUrl] = useState('');
  const [newSoundFile, setNewSoundFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Picture-in-Picture State
  const [isPipOpen, setIsPipOpen] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window|null>(null);
  const [pipSize, setPipSize] = useState<'sm'|'md'|'lg'>('md');
  const [pipTheme, setPipTheme] = useState<'glass'|'app'>('glass');
  const [showPipSettings, setShowPipSettings] = useState(false);
  const pipContainerRef = useRef<HTMLDivElement>(null);

  const isPipSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  const PIP_SIZES = {
    sm: { width: 300, height: 160 },
    md: { width: 320, height: 300 },
    lg: { width: 400, height: 340 },
  };

  const { accent } = useTheme();
  const { isHighQuality } = usePerformance();
  const { currentSound, isPlaying, volume, allSounds, playSound, setVolume, togglePlay, addCustomSound, removeCustomSound } = useSound();
  
  // --- PIP LOGIC ---
  const getPipHTML = () => {
    const subject = subjects.find(s => s.id === currentSubjectId);
    const subjectName = subject?.name || 'No Subject';
    const color = subject?.color || '#06b6d4';
    const displayMsLocal = isComplete ? 0 : (mode === 'stopwatch' ? elapsedMs : Math.max(0, (mode === 'pomodoro' ? durations.pomodoro : mode === 'short-break' ? durations.shortBreak : durations.longBreak) * 60000 - elapsedMs));
    const timeStr = formatTime(displayMsLocal);
    const todayStr = formatShort(dailyTotalMs + (status !== 'idle' ? elapsedMs : 0));
    const modeLabel = mode === 'pomodoro' ? 'Pomodoro' : mode === 'short-break' ? 'Short Break' : mode === 'long-break' ? 'Long Break' : 'Stopwatch';
    const now = new Date();
    const timeNow = now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    const randomQuote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    
    // Pomodoro ring SVG
    const r = 36;
    const circ = 2 * Math.PI * r;
    
    // Re-calculating progress for PiP since we don't have progressPercent directly in scope
    let progress = 0;
    if (status !== 'idle' && isTimerMode) {
        const currentDurationMs = (mode === 'short-break' ? durations.shortBreak : mode === 'long-break' ? durations.longBreak : durations.pomodoro) * 60000;
        progress = Math.min(1, elapsedMs / currentDurationMs);
    }
    const offset = circ * (1 - progress);
    
    const isGlass = pipTheme === 'glass';
    const bg = isGlass ? 'rgba(15,23,42,0.7)' : '#0f172a';
    const border = isGlass ? '1px solid rgba(255,255,255,0.12)' : `1px solid ${color}30`;
    const backdropFilter = isGlass ? 'blur(20px)' : 'none';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', system-ui, sans-serif;
            background: ${bg};
            backdrop-filter: ${backdropFilter};
            border: ${border};
            border-radius: 16px;
            overflow: hidden;
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
            user-select: none;
          }
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600;700&display=swap');
          .mono { font-family: 'JetBrains Mono', monospace; }
          
          /* Glass shimmer */
          body::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            pointer-events: none;
          }

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px 6px;
            border-bottom: 1px solid rgba(255,255,255,0.06);
          }
          .logo { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.4); }
          .time-now { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: rgba(255,255,255,0.35); }
          .status-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: ${status === 'running' ? '#10b981' : '#ef4444'};
            ${status === 'running' ? 'animation: pulse 2s infinite;' : ''}
          }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

          .body { flex: 1; display: flex; align-items: center; padding: 8px 14px; gap: 12px; }
          .ring-section { flex-shrink: 0; display: ${pipSize === 'sm' ? 'none' : 'flex'}; align-items: center; justify-content: center; }
          .info-section { flex: 1; min-width: 0; }
          
          .subject-row { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
          .subject-dot { width: 8px; height: 8px; border-radius: 50%; background: ${color}; flex-shrink: 0; box-shadow: 0 0 6px ${color}80; }
          .subject-name { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .mode-badge { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 1px 5px; border-radius: 4px; background: ${color}20; color: ${color}; border: 1px solid ${color}30; flex-shrink: 0; }

          .timer { font-size: ${pipSize === 'sm' ? '32px' : '42px'}; font-weight: 900; font-family: 'JetBrains Mono', monospace; color: white; line-height: 1; margin-bottom: 6px; letter-spacing: -1px; text-shadow: 0 0 20px ${color}60; }
          
          .stats-row { display: flex; gap: 10px; margin-bottom: 8px; }
          .stat { display: flex; flex-direction: column; gap: 1px; }
          .stat-value { font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; color: rgba(255,255,255,0.85); }
          .stat-label { font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.3); }

          .controls { display: flex; gap: 6px; align-items: center; }
          .btn { border: none; cursor: pointer; border-radius: 8px; font-weight: 700; font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s; padding: 6px 10px; }
          .btn:hover { opacity: 0.85; transform: scale(1.02); }
          .btn:active { transform: scale(0.98); }
          .btn-primary { background: ${color}; color: white; flex: 1; }
          .btn-stop { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); flex: 1; }
          
          .footer { padding: 6px 14px 10px; border-top: 1px solid rgba(255,255,255,0.05); }
          .quote { font-size: 9px; color: rgba(255,255,255,0.25); font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: ${pipSize === 'sm' ? 'none' : 'block'}; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display:flex;align-items:center;gap:6px;">
            <div class="status-dot"></div>
            <span class="logo">EkagraZone</span>
          </div>
          <span class="time-now">\${timeNow}</span>
        </div>

        <div class="body">
          \${mode === 'pomodoro' && pipSize !== 'sm' ? \`
          <div class="ring-section">
            <svg width="88" height="88" viewBox="0 0 88 88">
              <circle cx="44" cy="44" r="\${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="7"/>
              <circle cx="44" cy="44" r="\${r}" fill="none" stroke="\${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="\${circ}" stroke-dashoffset="\${offset}" transform="rotate(-90 44 44)" style="filter:drop-shadow(0 0 6px \${color}80)"/>
              <text x="44" y="48" text-anchor="middle" fill="white" font-size="13" font-weight="700" font-family="JetBrains Mono,monospace">\${Math.round(progress * 100)}%</text>
            </svg>
          </div>
          \` : ''}

          <div class="info-section">
            <div class="subject-row">
              <div class="subject-dot"></div>
              <span class="subject-name">\${subjectName}</span>
              <span class="mode-badge">\${modeLabel}</span>
            </div>
            
            <div class="timer">\${timeStr}</div>
            
            \${pipSize !== 'sm' ? \`
            <div class="stats-row">
              <div class="stat">
                <span class="stat-value">\${todayStr}</span>
                <span class="stat-label">Today</span>
              </div>
              <div class="stat" style="border-left:1px solid rgba(255,255,255,0.08);padding-left:10px;">
                <span class="stat-value" style="color:\${color}">
                  \${status === 'running' ? '🟢 Active' : status === 'paused' ? '⏸ Paused' : '⏹ Idle'}
                </span>
                <span class="stat-label">Status</span>
              </div>
            </div>
            \` : ''}

            <div class="controls">
              <button class="btn btn-primary" id="playPauseBtn">
                \${status === 'running' ? '⏸ Pause' : '▶ Resume'}
              </button>
              <button class="btn btn-stop" id="stopBtn">
                ⏹ Stop
              </button>
            </div>
          </div>
        </div>

        \${pipSize !== 'sm' ? \`
        <div class="footer">
          <div class="quote">"\${randomQuote}"</div>
        </div>
        \` : ''}

        <script>
          document.getElementById('playPauseBtn').addEventListener('click', () => { window.opener?.postMessage({ type: 'PIP_ACTION', action: 'togglePlayPause' }, '*'); });
          document.getElementById('stopBtn').addEventListener('click', () => { window.opener?.postMessage({ type: 'PIP_ACTION', action: 'stop' }, '*'); });
        </script>
      </body>
      </html>
    `;
  };

  const openPip = async () => {
    if (!isPipSupported) {
      alert('Picture-in-Picture requires Chrome or Brave browser. Please switch to Chrome/Brave to use this feature.');
      return;
    }

    try {
      const { width, height } = PIP_SIZES[pipSize];
      
      const pip = await (window as any).documentPictureInPicture.requestWindow({ width, height });
      setPipWindow(pip);
      setIsPipOpen(true);

      pip.document.open();
      pip.document.write(getPipHTML());
      pip.document.close();

      const handleMessage = (e: MessageEvent) => {
        if (e.data?.type !== 'PIP_ACTION') return;
        if (e.data.action === 'togglePlayPause') {
          status === 'running' ? onPause() : onStart();
        }
        if (e.data.action === 'stop') {
          onStop();
          pip.close();
        }
      };
      window.addEventListener('message', handleMessage);

      pip.addEventListener('pagehide', () => {
        setIsPipOpen(false);
        setPipWindow(null);
        window.removeEventListener('message', handleMessage);
      });

    } catch (err: any) {
      console.error('PiP failed:', err);
      if (err.name === 'NotAllowedError') {
        alert('Please interact with the page first before opening Picture-in-Picture.');
      }
    }
  };

  useEffect(() => {
    if (!isPipOpen || !pipWindow || pipWindow.closed) return;
    try {
      pipWindow.document.open();
      pipWindow.document.write(getPipHTML());
      pipWindow.document.close();
    } catch (e) {
      setIsPipOpen(false);
      setPipWindow(null);
    }
  }, [elapsedMs, status, currentSubjectId, mode, pipSize, pipTheme, isPipOpen]);

  useEffect(() => {
    return () => {
      if (pipWindow && !pipWindow.closed) {
        pipWindow.close();
      }
    };
  }, [pipWindow]);

  useEffect(() => {
    const handleClick = () => setShowPipSettings(false);
    if (showPipSettings) {
      setTimeout(() => document.addEventListener('click', handleClick), 100);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showPipSettings]);

  // --- WAKE LOCK LOGIC ---
  const [wakeLock, setWakeLock] = useState<any>(null);
  const [isWakeLockActive, setIsWakeLockActive] = useState(false);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLock(lock);
        setIsWakeLockActive(true);
        
        lock.addEventListener('release', () => {
          setIsWakeLockActive(false);
          setWakeLock(null);
        });
      } catch (err: any) {
        // Silently fail for NotAllowedError (common in iframes/background tabs)
        if (err.name !== 'NotAllowedError') {
          console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
        }
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock) {
      try {
        await wakeLock.release();
        setWakeLock(null);
        setIsWakeLockActive(false);
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && status === 'running') {
        requestWakeLock();
      }
    };

    if (status === 'running') {
      requestWakeLock();
      document.addEventListener('visibilitychange', handleVisibilityChange);
    } else {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]);
  // -----------------------
  
  // Sync edit state when props change
  useEffect(() => {
      setEditDurations(durations);
  }, [durations]);

  useEffect(() => {
      if (!isWallpaperMode) {
          fetchMotivationalQuote();
      }
  }, [isWallpaperMode]);

  const fetchMotivationalQuote = () => {
     setQuote(FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]);
  };

  const handleSaveDurations = () => {
      onUpdateDurations(editDurations);
      setIsEditing(false);
  };

  const handleResetDurations = () => {
      setEditDurations(DEFAULT_DURATIONS);
  };

  // Handle Adding Custom Sound
  const handleAddSound = async () => {
      if (!newSoundName.trim()) return;
      setUploadLoading(true);

      let src = '';

      if (newSoundType === 'url') {
          if (!newSoundUrl.trim()) { setUploadLoading(false); return; }
          src = newSoundUrl.trim();
      } else {
          if (!newSoundFile) { setUploadLoading(false); return; }
          // Convert file to base64 data URI
          try {
              src = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.onerror = reject;
                  reader.readAsDataURL(newSoundFile);
              });
          } catch (e) {
              console.error("File read error", e);
              setUploadLoading(false);
              return;
          }
      }

      const newSound: CustomSound = {
          id: `custom-${crypto.randomUUID()}`,
          label: newSoundName.trim(),
          src: src,
          isCustom: true
      };

      await addCustomSound(newSound);
      
      // Reset
      setNewSoundName('');
      setNewSoundUrl('');
      setNewSoundFile(null);
      setIsAddingSound(false);
      setUploadLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          // Basic validation (e.g. size < 10MB)
          if (file.size > 10 * 1024 * 1024) {
              alert("File too large. Max 10MB.");
              return;
          }
          setNewSoundFile(file);
      }
  };

  // Helper to get icon component
  const getSoundIcon = (iconName: string, size = 18) => {
      switch(iconName) {
          case 'cloud-rain': return <CloudRain size={size} />;
          case 'tree-pine': return <Trees size={size} />;
          case 'waves': return <Waves size={size} />;
          case 'book': return <BookOpen size={size} />;
          default: return <Music size={size} />;
      }
  };

  const isTimerMode = mode !== 'stopwatch';
  // Calculate target based on current mode and custom durations
  const targetDuration = isTimerMode ? (durations[mode as keyof typeof durations] || 25) * 60 * 1000 : 0;
  
  const remainingMs = targetDuration - elapsedMs;
  const displayMs = isTimerMode ? remainingMs : elapsedMs;
  const isComplete = isTimerMode && elapsedMs >= targetDuration && mode !== 'pomodoro';

  const formatTime = (ms: number) => {
    const isNegative = ms < 0;
    const absMs = Math.abs(ms);
    const totalSeconds = Math.floor(absMs / 1000); 
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    
    let timeStr = "";
    if (hours > 0) {
      timeStr = `${hours}:${pad(minutes)}:${pad(seconds)}`;
    } else {
      timeStr = `${pad(minutes)}:${pad(seconds)}`;
    }

    return isNegative ? `+${timeStr}` : timeStr;
  };

  const formatShort = (ms: number) => {
      const hours = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      if (hours === 0 && mins === 0) return '0m';
      if (hours === 0) return `${mins}m`;
      return `${hours}h ${mins}m`;
  };

  // Determine colors based on mode (Hex or Class)
  const getTheme = () => {
      // Break colors (Fixed Hex for simplicity)
      if (mode === 'short-break') return { bg: '#14b8a6', text: '#2dd4bf', stroke: '#14b8a6', isHex: true }; // teal-500
      if (mode === 'long-break') return { bg: '#6366f1', text: '#818cf8', stroke: '#6366f1', isHex: true }; // indigo-500

      // Subject color
      if (isHexColor(subjectColor)) {
          return { bg: subjectColor, text: subjectColor, stroke: subjectColor, isHex: true };
      }
      
      // Legacy Class fallback
      return { 
          bg: subjectColor, 
          text: subjectColor.replace('bg-', 'text-'), 
          stroke: subjectColor.replace('bg-', 'text-'), 
          isHex: false 
      };
  };

  const theme = getTheme();

  // SVG Config
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = isTimerMode 
    ? Math.max(0, remainingMs / targetDuration) 
    : 0;
  const strokeDashoffset = circumference * (1 - progressPercent);

  // IMMERSIVE / ZEN MODE LAYOUT
  if (isWallpaperMode) {
      return (
          <>
            <div className={`flex flex-col md:flex-row items-center gap-4 md:gap-6 p-5 md:p-6 bg-black/40 backdrop-blur-xl rounded-[2.5rem] md:rounded-full border border-white/10 shadow-2xl animate-in slide-in-from-bottom-8 relative z-10`}>
            {/* Timers */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 px-2 md:px-4">
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">{mode === 'pomodoro' ? 'Focus Session' : mode === 'stopwatch' ? 'Timer' : 'Break'}</span>
                    <div className={`text-5xl md:text-6xl font-mono font-bold tabular-nums tracking-tight drop-shadow-lg leading-none ${isOvertime ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
                        {isComplete ? "DONE" : formatTime(displayMs)}
                    </div>
                </div>
                
                <div className="hidden md:block w-px h-12 bg-white/10" />
                <div className="w-full h-px bg-white/10 md:hidden" />
                
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Global Total</span>
                    <div className="text-5xl md:text-6xl font-mono font-bold tabular-nums tracking-tight drop-shadow-lg leading-none text-white/90">
                        {formatTime(dailyTotalMs + (status !== 'idle' ? elapsedMs : 0))}
                    </div>
                </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-white/20 pt-4 md:pt-0 md:pl-6 w-full md:w-auto justify-center">
                <ZenSubjectPanel 
                    subjects={subjects}
                    selectedSubjectId={currentSubjectId}
                    onSelectSubject={onSelectSubject}
                    isTimerRunning={status === 'running'}
                    className="relative z-50 mr-2"
                />
                <div className="text-white/80 text-xs font-bold uppercase tracking-widest mr-2 flex items-center gap-2">
                     {isWakeLockActive && <Sun size={12} className="text-amber-400 animate-pulse hidden sm:block" />}
                </div>
                {status === 'running' ? (
                     <button onClick={onPause} className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg">
                         <Pause size={20} fill="currentColor" />
                     </button>
                ) : (
                     <button onClick={onStart} className={`p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg ${isComplete ? 'hidden' : ''}`}>
                         <Play size={20} fill="currentColor" className="ml-0.5" />
                     </button>
                )}
                
                {(status === 'paused' || status === 'running' || isComplete) && (
                     <button onClick={onStop} className="p-3 bg-red-500/20 text-red-200 hover:bg-red-500 hover:text-white rounded-full transition-colors backdrop-blur-md border border-red-500/30">
                         {isComplete ? <CheckCircle2 size={20} /> : <Square size={20} fill="currentColor" />}
                     </button>
                )}
                
                {/* Zen Sound Toggle */}
                <button 
                    onClick={togglePlay}
                    className={`p-3 rounded-full transition-colors backdrop-blur-md border ${isPlaying ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-white/10 text-white/50 border-white/10'}`}
                >
                    {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            </div>
          </div>
        </>
      );
  }

  // STANDARD LAYOUT
  return (
    <div className="flex flex-col items-center relative w-full min-h-full select-none px-4 md:px-12 justify-center">
        <style>{`
          @keyframes breathe {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.02); filter: brightness(1.1); }
          }
          @keyframes slideUpFade {
            from { opacity: 0; transform: translateY(20px) scale(0.9); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.3); opacity: 0; }
          }
          .animate-breathe {
            animation: breathe 4s ease-in-out infinite;
          }
          .animate-enter {
            animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .animate-pulse-ring {
             animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>

        <div className="relative z-10 flex flex-col md:grid md:grid-cols-3 items-center w-full max-w-[1600px] gap-4 md:gap-8 justify-between py-2 md:py-0 md:items-center md:justify-center min-h-full">
            
            {/* --- LEFT COLUMN: Side Panel (Goals) --- */}
            {sidePanel ? (
                <div className="hidden md:block w-full h-full max-h-[500px] justify-self-start animate-in fade-in slide-in-from-left-8 duration-700 order-3 md:order-1">
                    {sidePanel}
                </div>
            ) : (
                <div className="hidden md:block w-full order-3 md:order-1"></div>
            )}

            {/* --- MIDDLE COLUMN: VISUALIZATION --- */}
            <div className="relative w-full flex flex-col items-center justify-center order-1 md:order-2 md:justify-self-center flex-1 min-h-0">
                
                {/* Visualization Container - fluid max width for mobile */}
                <div id="timer-circle" className="relative w-full aspect-square max-w-[260px] sm:max-w-[320px] md:max-w-[50vmin] flex items-center justify-center">
                    
                    {/* Animated Background Blob */}
                    {isHighQuality && (
                        <>
                            <div 
                                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] rounded-full blur-[100px] transition-all duration-1000 pointer-events-none
                                ${status === 'running' ? 'opacity-40 scale-100' : 'opacity-10 scale-75'}
                                ${!theme.isHex && status === 'running' ? theme.bg : 'bg-slate-700'}
                                ${isComplete ? 'bg-emerald-500 opacity-40 scale-110' : ''}
                                `}
                                style={theme.isHex && status === 'running' && !isComplete ? { backgroundColor: theme.bg } : {}}
                            />
                            
                            {/* Second pulsing blob */}
                            <div 
                                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full blur-[60px] pointer-events-none transition-all duration-700
                                ${status === 'running' ? 'opacity-30 animate-pulse' : 'opacity-0'}
                                ${!theme.isHex ? theme.bg : ''}
                                `} 
                                style={theme.isHex ? { backgroundColor: theme.bg } : {}}
                            />
                        </>
                    )}

                    {/* Visual Rings */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {isTimerMode ? (
                            <svg className="w-full h-full -rotate-90 drop-shadow-2xl overflow-visible" viewBox="0 0 100 100">
                                {/* Track */}
                                <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                                {/* Progress */}
                                <circle cx="50" cy="50" r={radius} fill="none" 
                                    stroke={isComplete ? '#34d399' : (theme.isHex ? theme.stroke : 'currentColor')}
                                    strokeWidth="5" 
                                    strokeLinecap="round" 
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    className={`transition-all duration-1000 ease-linear ${!theme.isHex ? theme.stroke : ''} ${status === 'running' ? 'drop-shadow-[0_0_10px_currentColor]' : ''}`}
                                />
                            </svg>
                        ) : (
                            // Stopwatch Spinner
                            <>
                            <div className={`absolute inset-0 rounded-full border-2 border-dashed border-white/10 transition-all duration-1000 ${status === 'running' ? 'animate-[spin_12s_linear_infinite] opacity-100 scale-100' : 'opacity-30 scale-95'}`} />
                            <div className={`absolute inset-4 rounded-full border border-white/5 transition-all duration-1000 ${status === 'running' ? 'animate-[spin_8s_linear_infinite_reverse] opacity-80' : 'opacity-20'}`} />
                            {/* Pulse Ring when running */}
                            {status === 'running' && (
                                    <div className={`absolute inset-0 rounded-full border border-white/5 animate-pulse-ring`} />
                            )}
                            </>
                        )}
                    </div>

                    {/* Digital Time & Stats */}
                    <div className={`flex flex-col items-center z-10 transition-transform duration-500 ${status === 'running' ? 'animate-breathe' : ''}`}>
                        <div 
                            className={`font-mono font-bold select-none drop-shadow-2xl leading-none tracking-tighter tabular-nums font-feature-settings-tnum transition-all duration-500 text-[18vw] sm:text-[15vmin] md:text-[10vmin] 
                            ${isComplete ? 'text-emerald-400 scale-110' : ''}
                            ${isOvertime ? 'text-amber-400 animate-pulse drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]' : (!theme.isHex ? theme.text : '')}`}
                            style={theme.isHex && !isComplete && !isOvertime ? { color: theme.text } : {}}
                        >
                            {isComplete ? "DONE" : formatTime(displayMs)}
                        </div>
                        
                        {/* Contextual Info */}
                        {mode === 'stopwatch' || mode === 'pomodoro' ? (
                            <div className="flex flex-col items-center mt-2 md:mt-4 gap-2">
                                {isOvertime && (
                                    <div className="animate-in slide-in-from-bottom-2 fade-in flex flex-col items-center gap-1">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter animate-bounce">Overtime Active</span>
                                    </div>
                                )}

                                <div className={`px-3 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/10 text-slate-300 text-[10px] md:text-xs font-medium flex items-center gap-2 animate-enter`}>
                                    <div 
                                        className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] ${!theme.isHex ? theme.bg : ''} ${status === 'running' ? 'animate-pulse' : ''}`} 
                                        style={theme.isHex ? { backgroundColor: theme.bg, boxShadow: `0 0 5px ${theme.bg}` } : {}}
                                    />
                                    <span title="Subject Total">Sub: {formatShort(todaySubjectTotal + (status !== 'idle' ? elapsedMs : 0))}</span>
                                    {isWakeLockActive && (
                                        <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/10 text-amber-400/80" title="Screen Wake Lock Active">
                                            <Sun size={10} className="animate-pulse" />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Small Global Timer Text */}
                                <div className="mt-4 md:mt-6 flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
                                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Global Total</span>
                                    <div className="font-mono font-bold select-none drop-shadow-lg leading-none tracking-tighter tabular-nums text-4xl sm:text-5xl text-white/90">
                                        {formatTime(dailyTotalMs + (status !== 'idle' ? elapsedMs : 0))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 text-xs font-medium text-slate-400 animate-enter bg-slate-900/40 px-3 py-1 rounded-full border border-white/5">
                                {mode === 'short-break' ? 'Take a breath' : 'Rest & Recharge'}
                            </div>
                        )}
                    
                    </div>
                </div>

                {/* Motivational Quote */}
                {quote && (
                    <div className="mt-4 md:mt-8 text-center max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 px-4">
                        <p className="text-sm md:text-base font-medium text-slate-300 italic opacity-80 leading-relaxed line-clamp-2 md:line-clamp-none">"{quote}"</p>
                    </div>
                )}
            </div>

            {/* --- RIGHT COLUMN: CONTROLS --- */}
            <div className="flex flex-col items-center md:items-end gap-6 md:gap-8 order-2 md:order-3 w-full max-w-xs md:justify-self-end flex-none pb-4 md:pb-0">
                
                {/* Top Level Mode Switcher */}
                <div className="flex flex-col items-center w-full">
                  <div id="timer-modes" className="flex bg-slate-900/60 backdrop-blur-xl rounded-full p-1 border border-white/10 shadow-2xl transition-transform duration-300 hover:scale-105">
                      <button 
                          onClick={() => onSetMode('stopwatch')}
                          disabled={status !== 'idle' || isEditing}
                          className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-300 ${mode === 'stopwatch' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                          <Timer size={14} className={mode === 'stopwatch' ? `text-${accent}-400` : ''} /> Stopwatch
                      </button>
                      <button 
                          onClick={() => onSetMode('pomodoro')} 
                          disabled={status !== 'idle' || isEditing}
                          className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-300 ${isTimerMode ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                          <Hourglass size={14} className={isTimerMode ? `text-${accent}-400` : ''} /> Timer
                      </button>
                  </div>
                  
                  {isPipSupported && (
                    <div className="flex items-center gap-2 mt-3 mb-1" ref={pipContainerRef}>
                      {/* PiP Settings dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setShowPipSettings(s => !s)}
                          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs"
                          title="PiP Settings"
                        >
                          ⚙️
                        </button>
                        
                        <AnimatePresence>
                          {showPipSettings && (
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              className="absolute right-0 sm:left-0 sm:right-auto bottom-full mb-2 bg-slate-900 border border-white/10 rounded-xl p-3 shadow-xl z-50 w-48"
                            >
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                Window Size
                              </div>
                              <div className="flex gap-1.5 mb-3">
                                {(['sm','md','lg'] as const).map(s => (
                                  <button key={s}
                                    onClick={() => setPipSize(s)}
                                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all
                                      ${pipSize === s 
                                        ? `bg-${accent}-500/20 text-${accent}-300 border border-${accent}-500/30` 
                                        : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}
                                  >
                                    {s === 'sm' ? 'S' : s === 'md' ? 'M' : 'L'}
                                  </button>
                                ))}
                              </div>

                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                                Theme
                              </div>
                              <div className="flex gap-1.5">
                                {(['glass','app'] as const).map(t => (
                                  <button key={t}
                                    onClick={() => setPipTheme(t)}
                                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all capitalize
                                      ${pipTheme === t 
                                        ? `bg-${accent}-500/20 text-${accent}-300 border border-${accent}-500/30` 
                                        : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}
                                  >
                                    {t === 'glass' ? '🪟 Glass' : '🎨 App'}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        onClick={isPipOpen ? () => { pipWindow?.close(); setIsPipOpen(false); } : openPip}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
                          ${isPipOpen 
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/25' 
                            : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'}`}
                        title="Float timer in a window on top of everything"
                      >
                        <Clock size={12} />
                        {isPipOpen ? '✓ Floating' : 'Float Timer'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Timer Sub-options & Custom Settings Toggle */}
                {isTimerMode && (
                    <div className="w-full flex flex-col items-center md:items-end">
                         <div className="flex flex-wrap justify-center md:justify-end gap-2 animate-in slide-in-from-top-2 fade-in duration-300 mb-2 md:mb-4">
                            <button 
                                onClick={() => onSetMode('pomodoro')}
                                disabled={status !== 'idle' || isEditing}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${mode === 'pomodoro' ? `bg-${accent}-500/20 border-${accent}-500/30 text-${accent}-300` : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            >
                                Focus ({durations.pomodoro}m)
                            </button>
                            <button 
                                onClick={() => onSetMode('short-break')}
                                disabled={status !== 'idle' || isEditing}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${mode === 'short-break' ? 'bg-teal-500/20 border-teal-500/30 text-teal-300' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            >
                                <Coffee size={12} /> Short ({durations['short-break']}m)
                            </button>
                            <button 
                                onClick={() => onSetMode('long-break')}
                                disabled={status !== 'idle' || isEditing}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${mode === 'long-break' ? 'bg-blue-600/20 border-blue-600/30 text-blue-300' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                            >
                                <Armchair size={12} /> Long ({durations['long-break']}m)
                            </button>
                        </div>
                        
                        {/* Edit Button */}
                        <div className="flex justify-center md:justify-end w-full">
                             <button 
                                onClick={() => { setIsEditing(!isEditing); setShowSoundMenu(false); }}
                                disabled={status !== 'idle'}
                                className={`text-[10px] flex items-center gap-1 hover:text-white transition-colors ${isEditing ? `text-${accent}-400` : 'text-slate-600'}`}
                             >
                                 <Settings2 size={12} /> {isEditing ? 'Cancel Editing' : 'Customize Sessions'}
                             </button>
                        </div>
                    </div>
                )}

                {/* Edit Form */}
                {isEditing ? (
                    <div className="w-full bg-slate-800/50 border border-white/5 p-4 rounded-2xl animate-in fade-in slide-in-from-right-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 text-right">Custom Durations (min)</h4>
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300">Focus</span>
                                <input 
                                    type="number" 
                                    className={`w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-sm text-white focus:border-${accent}-500 outline-none`}
                                    value={editDurations.pomodoro}
                                    onChange={(e) => setEditDurations({...editDurations, pomodoro: Math.max(1, parseInt(e.target.value) || 0)})}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300">Short Break</span>
                                <input 
                                    type="number" 
                                    className={`w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-sm text-white focus:border-${accent}-500 outline-none`}
                                    value={editDurations['short-break']}
                                    onChange={(e) => setEditDurations({...editDurations, 'short-break': Math.max(1, parseInt(e.target.value) || 0)})}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-300">Long Break</span>
                                <input 
                                    type="number" 
                                    className={`w-16 bg-slate-900 border border-slate-700 rounded-lg p-1 text-center text-sm text-white focus:border-${accent}-500 outline-none`}
                                    value={editDurations['long-break']}
                                    onChange={(e) => setEditDurations({...editDurations, 'long-break': Math.max(1, parseInt(e.target.value) || 0)})}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={handleResetDurations} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 text-xs font-semibold">Reset</button>
                             <button onClick={handleSaveDurations} className={`flex-1 py-2 bg-${accent}-600 hover:bg-${accent}-500 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1`}>
                                 <Save size={12} /> Save
                             </button>
                        </div>
                    </div>
                ) : showSoundMenu ? (
                    // SOUND MENU PANEL
                    <div className="w-full bg-slate-800/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl animate-in fade-in slide-in-from-right-4 relative overflow-hidden">
                        
                        {isAddingSound ? (
                            // --- ADD SOUND FORM ---
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <h4 className="text-xs font-bold text-white uppercase">Add Sound</h4>
                                    <button onClick={() => setIsAddingSound(false)} className="text-slate-400 hover:text-white"><X size={14}/></button>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Name</label>
                                    <input 
                                        className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white focus:border-indigo-500 outline-none"
                                        placeholder="e.g. My Lofi Mix"
                                        value={newSoundName}
                                        onChange={(e) => setNewSoundName(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <div className="flex bg-slate-900 rounded-lg p-1 mb-2">
                                        <button 
                                            onClick={() => setNewSoundType('url')}
                                            className={`flex-1 text-[10px] font-bold py-1.5 rounded ${newSoundType === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                                        >
                                            URL
                                        </button>
                                        <button 
                                            onClick={() => setNewSoundType('file')}
                                            className={`flex-1 text-[10px] font-bold py-1.5 rounded ${newSoundType === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                                        >
                                            File Upload
                                        </button>
                                    </div>

                                    {newSoundType === 'url' ? (
                                        <div className="relative">
                                            <LinkIcon size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input 
                                                className="w-full bg-slate-900 border border-white/10 rounded-lg py-2 pl-7 pr-2 text-xs text-white focus:border-indigo-500 outline-none"
                                                placeholder="https://..."
                                                value={newSoundUrl}
                                                onChange={(e) => setNewSoundUrl(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative group cursor-pointer">
                                            <input 
                                                type="file" 
                                                accept="audio/*" 
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full"
                                                onChange={handleFileChange}
                                            />
                                            <div className="bg-slate-900 border border-dashed border-white/20 rounded-lg p-4 flex flex-col items-center justify-center text-slate-400 group-hover:border-indigo-500 group-hover:text-indigo-400 transition-colors">
                                                <Upload size={16} className="mb-1" />
                                                <span className="text-[10px] font-medium truncate max-w-full px-2">
                                                    {newSoundFile ? newSoundFile.name : "Click to select audio file"}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={handleAddSound}
                                    disabled={!newSoundName || uploadLoading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2"
                                >
                                    {uploadLoading ? 'Processing...' : 'Add Sound'}
                                </button>
                            </div>
                        ) : (
                            // --- SOUND LIST ---
                            <>
                                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                    <h4 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
                                        <Music size={14} /> Soundscapes
                                    </h4>
                                    <button onClick={() => setShowSoundMenu(false)} className="text-[10px] text-slate-500 hover:text-white">Close</button>
                                </div>
                                
                                <div className="mb-4">
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>Volume</span>
                                        <span>{Math.round(volume * 100)}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.05"
                                        value={volume}
                                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-white"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {allSounds.map(sound => (
                                        <div key={sound.id} className="relative group">
                                            <button
                                                onClick={() => playSound(sound.id)}
                                                className={`
                                                    w-full flex flex-col items-center justify-center p-2 rounded-xl transition-all gap-1 h-full
                                                    ${currentSound === sound.id 
                                                        ? (isPlaying ? `bg-${accent}-500/20 text-${accent}-300 border border-${accent}-500/30` : 'bg-white/5 text-slate-300 border border-white/10')
                                                        : 'hover:bg-white/5 text-slate-500 border border-transparent'}
                                                `}
                                            >
                                                {getSoundIcon(sound.icon)}
                                                <span className="text-[9px] font-bold uppercase truncate max-w-full px-1">{sound.label}</span>
                                                {currentSound === sound.id && isPlaying && <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />}
                                            </button>
                                            
                                            {/* Delete Button for Custom Sounds */}
                                            {sound.isCustom && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if(confirm(`Delete "${sound.label}"?`)) removeCustomSound(sound.id);
                                                    }}
                                                    className="absolute top-1 right-1 p-1 bg-black/50 text-slate-400 hover:text-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {/* Add Button */}
                                    <button 
                                        onClick={() => setIsAddingSound(true)}
                                        className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-white/10 text-slate-500 hover:text-white hover:bg-white/5 transition-all gap-1"
                                    >
                                        <Plus size={18} />
                                        <span className="text-[9px] font-bold uppercase">Add</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    // MAIN CONTROLS
                    <div id="timer-controls" className="flex gap-4 items-center h-20 md:h-24">
                        {status === 'running' ? (
                            <div key="pause-btn" className="animate-enter">
                                <button 
                                    onClick={onPause}
                                    className="group relative p-5 md:p-6 rounded-[2rem] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 backdrop-blur-xl transition-all hover:scale-110 active:scale-95 shadow-lg border border-amber-500/20"
                                >
                                    <Pause size={28} className="md:w-8 md:h-8" fill="currentColor" />
                                </button>
                            </div>
                        ) : (
                            <div key="play-btn" className={`animate-enter ${isComplete ? 'hidden' : ''}`}>
                                <button 
                                    onClick={onStart}
                                    className={`group relative p-5 md:p-6 rounded-[2rem] bg-slate-100 text-slate-900 hover:bg-white hover:scale-110 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]`}
                                >
                                    <Play size={28} className="md:w-8 md:h-8 ml-1" fill="currentColor" />
                                </button>
                            </div>
                        )}

                        {(status === 'paused' || status === 'running' || isComplete) && (
                            <div key="stop-btn" className="animate-enter" style={{ animationDelay: '50ms' }}>
                                <button 
                                    onClick={onStop}
                                    className={`group relative p-5 md:p-6 rounded-[2rem] backdrop-blur-xl transition-all hover:scale-110 active:scale-95 shadow-lg border 
                                        ${isComplete 
                                            ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-bounce' 
                                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'}
                                    `}
                                >
                                    {isComplete ? <CheckCircle2 size={28} className="md:w-8 md:h-8" /> : <Square size={28} className="md:w-8 md:h-8" fill="currentColor" />}
                                </button>
                            </div>
                        )}
                        
                        {/* Sound Menu Toggle */}
                        <div key="sound-btn" className="animate-enter" style={{ animationDelay: '100ms' }}>
                            <button
                                onClick={() => { setShowSoundMenu(true); setIsEditing(false); }}
                                className={`
                                    p-4 rounded-full backdrop-blur-xl transition-all border
                                    ${isPlaying 
                                        ? `bg-${accent}-500/20 text-${accent}-300 border-${accent}-500/30` 
                                        : 'bg-slate-800/40 text-slate-500 border-white/5 hover:text-slate-300 hover:bg-slate-800/60'}
                                `}
                            >
                                {isPlaying ? <Volume2 size={20} className="animate-pulse" /> : <Music size={20} />}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
});
