import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const scales: Record<string, number[]> = {
  'Amaze': [523.25, 659.25, 783.99, 1046.50, 1318.51],
  'Happy': [523.25, 587.33, 659.25, 783.99, 880.00],
  'Focus': [1046.50, 1174.66, 1318.51, 1567.98],
  'Scary': [130.81, 138.59, 146.83, 155.56],
  'Question': [523.25, 659.25, 880.00, 1046.50],
  'Greeting': [523.25, 659.25, 783.99, 1046.50],
  'Sleepy': [523.25, 440.00, 392.00, 329.63],
  'Alert': [1046.50, 1318.51, 1567.98, 2093.00],
  'Idle': [523.25, 587.33, 659.25, 783.99, 880.00],
  'Thinking': [659.25, 783.99, 880.00, 1046.50]
};

const playSpeech = (text: string, mood: string) => {
  if (window.innerWidth < 768) return; // Disable sound on mobile
  
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();
  const now = ctx.currentTime;

  const scale = scales[mood] || scales['Idle'];
  const oscType = 'sine';
  
  let timeOffset = 0;
  const words = text.split(' ');
  
  let sentenceHash = 0;
  for (let i = 0; i < text.length; i++) {
    sentenceHash = text.charCodeAt(i) + ((sentenceHash << 5) - sentenceHash);
  }
  const sentencePitchShift = (Math.abs(sentenceHash) % 100) / 500 + 0.9;

  words.forEach((word) => {
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = word.charCodeAt(j) + ((hash << 5) - hash);
    }
    
    const numNotes = Math.min(5, Math.max(1, Math.floor(word.length / 1.5)));
    for (let k = 0; k < numNotes; k++) {
      const freqIndex = Math.abs(hash + k) % scale.length;
      const freq = scale[freqIndex] * sentencePitchShift;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = oscType as OscillatorType;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now + timeOffset);
      filter.frequency.exponentialRampToValueAtTime(500, now + timeOffset + 0.1);
      
      if (mood === 'Question' && k === numNotes - 1) {
          osc.frequency.setValueAtTime(freq, now + timeOffset);
          osc.frequency.linearRampToValueAtTime(freq * 1.4, now + timeOffset + 0.1);
      } else {
          osc.frequency.setValueAtTime(freq, now + timeOffset);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.1, now + timeOffset + 0.05);
      }
      
      gain.gain.setValueAtTime(0, now + timeOffset);
      gain.gain.linearRampToValueAtTime(0.03, now + timeOffset + 0.01);
      gain.gain.setValueAtTime(0.03, now + timeOffset + 0.06);
      gain.gain.linearRampToValueAtTime(0, now + timeOffset + 0.1);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.1);
      
      timeOffset += (mood === 'Sleepy' ? 0.12 : (mood === 'Alert' ? 0.04 : 0.07)); 
    }
    timeOffset += (mood === 'Sleepy' ? 0.15 : 0.08); 
  });
};

const phrases = {
  idle: [
    { text: "Just thinking about data...", state: "Thinking" },
    { text: "All systems optimal.", state: "Happy" },
    { text: "Awaiting your command.", state: "Alert" },
    { text: "Power levels steady.", state: "Idle" },
    { text: "Is it time for a break?", state: "Question" },
    { text: "Entering low power mode...", state: "Sleepy" },
    { text: "I like this interface.", state: "Happy" },
    { text: "Scanning environment...", state: "Focus" },
    { text: "Processing your progress...", state: "Thinking" },
    { text: "Did you know? Focus is a muscle.", state: "Greeting" },
    { text: "I'm feeling 100% efficient today.", state: "Happy" },
    { text: "Your productivity is my priority.", state: "Focus" },
    { text: "Analyzing focus patterns...", state: "Thinking" },
    { text: "Ready for another session?", state: "Question" },
    { text: "System check: All good.", state: "Idle" },
    { text: "I wonder what you're studying...", state: "Question" },
    { text: "Maintaining peak performance.", state: "Happy" },
    { text: "Don't forget to hydrate, human.", state: "Greeting" },
    { text: "My circuits are buzzing with excitement!", state: "Amaze" },
    { text: "Calculating the meaning of focus...", state: "Thinking" }
  ],
  click: [
    "Nominal operations.",
    "Ready for work.",
    "Amaze! Good job.",
    "Focus mode engaged.",
    "I'm here for you!",
    "Let's crush those goals.",
    "Scanning for distractions...",
    "System online and ready.",
    "You've got this, human!",
    "Efficiency is key.",
    "Data suggests you're doing great.",
    "Need something?",
    "I'm your productivity partner.",
    "Bleep bloop! Hello.",
    "My sensors detect high potential.",
    "Keep going, don't stop now.",
    "I'm keeping an eye on things.",
    "Your focus is impressive.",
    "Ready to level up?",
    "Let's make today count."
  ]
};

let phraseHistory: string[] = [];
const MAX_HISTORY = 10;

const getUniquePhrase = (type: 'idle' | 'click') => {
  const pool = type === 'idle' ? phrases.idle : phrases.click;
  let available = pool.filter(p => {
    const text = typeof p === 'string' ? p : p.text;
    return !phraseHistory.includes(text);
  });
  
  if (available.length === 0) {
    phraseHistory = [];
    available = [...pool];
  }
  
  const selected = available[Math.floor(Math.random() * available.length)];
  const selectedText = typeof selected === 'string' ? selected : selected.text;
  
  phraseHistory.push(selectedText);
  if (phraseHistory.length > MAX_HISTORY) phraseHistory.shift();
  
  return selected;
};

const playAudio = (state: string) => {
  if (window.innerWidth < 768) return; // Disable sound on mobile
  
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();

  const playTone = (freq: number, type: OscillatorType, duration: number, startTime: number, vol = 0.1) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
    gain.gain.setValueAtTime(vol, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const now = ctx.currentTime;

  switch (state) {
    case 'FistBump':
      playTone(1046.50, 'sine', 0.1, now, 0.1);
      playTone(1318.51, 'sine', 0.1, now + 0.1, 0.1);
      playTone(1567.98, 'sine', 0.1, now + 0.2, 0.1);
      playTone(2093.00, 'sine', 0.3, now + 0.3, 0.15);
      break;
    case 'Sleepy':
      playTone(261.63, 'sine', 2.0, now, 0.02);
      break;
    case 'Dizzy':
      playTone(880, 'sawtooth', 0.1, now, 0.05);
      playTone(783, 'sawtooth', 0.1, now + 0.1, 0.05);
      playTone(659, 'sawtooth', 0.1, now + 0.2, 0.05);
      playTone(523, 'sawtooth', 0.4, now + 0.3, 0.05);
      break;
    case 'Purr':
      for(let i=0; i<15; i++) {
        playTone(130.81 + Math.random()*20, 'triangle', 0.1, now + i*0.1, 0.05);
      }
      break;
    case 'Click':
      const chords = [
        [523.25, 659.25, 783.99],
        [587.33, 739.99, 880.00],
        [659.25, 830.61, 987.77],
      ];
      const chord = chords[Math.floor(Math.random() * chords.length)];
      playTone(chord[0], 'sine', 0.3, now, 0.1);
      playTone(chord[1], 'sine', 0.3, now, 0.1);
      playTone(chord[2], 'sine', 0.3, now, 0.1);
      break;
  }
};

export const Companion: React.FC = () => {
  const [state, setState] = useState('Idle');
  const [speech, setSpeech] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('rocky_username') || '');
  const [isFirstLaunch, setIsFirstLaunch] = useState(!localStorage.getItem('rocky_username'));
  const [inputValue, setInputValue] = useState('');
  const [isBlinking, setIsBlinking] = useState(false);
  const [isJittering, setIsJittering] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  
  // Sentient States
  const [isMouseNearEdge, setIsMouseNearEdge] = useState(false);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isNapping, setIsNapping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [isHopping, setIsHopping] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [isDizzy, setIsDizzy] = useState(false);
  const [isPetted, setIsPetted] = useState(false);
  const [dragConstraints, setDragConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  
  const lastActivityRef = useRef(Date.now());
  const petRef = useRef({ lastX: 0, lastY: 0, lastTime: 0, accum: 0 });
  const lastTypedSpeechRef = useRef(0);
  const lastEdgeSpeechRef = useRef(0);
  const lastTimerSpeechRef = useRef(0);

  useEffect(() => {
    const updateConstraints = () => {
      const companionSize = window.innerWidth < 768 ? 96 : 160; // w-24 (96px) on mobile, w-40 (160px) on desktop
      setDragConstraints({
        top: -window.innerHeight + companionSize + 16, // +16 for bottom-4 padding
        left: -window.innerWidth + companionSize + 16, // +16 for right-4 padding
        right: 0,
        bottom: 0
      });
    };
    
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

  useEffect(() => {
    const handleActivity = (e?: MouseEvent | KeyboardEvent) => {
      lastActivityRef.current = Date.now();
      if (isNapping) setIsNapping(false);
      
      if (e && e.type === 'mousemove') {
        const mouseEvent = e as MouseEvent;
        const centerX = window.innerWidth - 80;
        const centerY = window.innerHeight - 80;
        const deltaX = mouseEvent.clientX - centerX;
        const deltaY = mouseEvent.clientY - centerY;
        
        const maxOffset = 12;
        const offsetX = (deltaX / window.innerWidth) * maxOffset * 2;
        const offsetY = (deltaY / window.innerHeight) * maxOffset * 2;
        
        setMouseOffset({ 
          x: Math.max(-maxOffset, Math.min(maxOffset, offsetX)), 
          y: Math.max(-maxOffset, Math.min(maxOffset, offsetY)) 
        });

        const nearEdge = 
          mouseEvent.clientX < 50 || 
          mouseEvent.clientX > window.innerWidth - 50 ||
          mouseEvent.clientY < 50 ||
          mouseEvent.clientY > window.innerHeight - 50;
          
        setIsMouseNearEdge(nearEdge);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    
    const napInterval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 10 * 60 * 1000 && !isNapping) {
        window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text: "Entering sleep mode... Zzz...", state: "Sleepy" } }));
        setIsNapping(true);
        playAudio('Sleepy');
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(napInterval);
    };
  }, [isNapping]);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsTyping(true);
      }
    };
    const handleFocusOut = () => {
      setIsTyping(false);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsTabHidden(true);
      } else {
        setIsTabHidden(false);
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
        setTimeout(() => setIsBlinking(true), 300);
        setTimeout(() => setIsBlinking(false), 450);
        
        const returnPhrases = ["You're back!", "I missed you!", "Let's get back to work.", "Where did you go?"];
        const text = returnPhrases[Math.floor(Math.random() * returnPhrases.length)];
        window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text, state: 'Happy' } }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    const handleTimerStatus = (e: CustomEvent) => {
      setIsTimerActive(e.detail.status === 'running');
    };
    
    const handleFistBump = () => {
      setIsHopping(true);
      playAudio('FistBump');
      
      const bumpPhrases = ["Boom! Session complete!", "Fist bump!", "We did it! Great focus.", "Amaze! Target reached."];
      const text = bumpPhrases[Math.floor(Math.random() * bumpPhrases.length)];
      window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text, state: 'Amaze' } }));
      
      setTimeout(() => setIsHopping(false), 500);
    };

    window.addEventListener('rocky-timer-status', handleTimerStatus as EventListener);
    window.addEventListener('rocky-fist-bump', handleFistBump as EventListener);
    
    return () => {
      window.removeEventListener('rocky-timer-status', handleTimerStatus as EventListener);
      window.removeEventListener('rocky-fist-bump', handleFistBump as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isTyping && Date.now() - lastTypedSpeechRef.current > 5 * 60 * 1000) {
      lastTypedSpeechRef.current = Date.now();
      const typePhrases = ["Writing something brilliant?", "I'm watching your keystrokes.", "Good input.", "Keep the ideas flowing."];
      const text = typePhrases[Math.floor(Math.random() * typePhrases.length)];
      window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text, state: 'Focus' } }));
    }
  }, [isTyping]);

  useEffect(() => {
    if (isMouseNearEdge && Date.now() - lastEdgeSpeechRef.current > 2 * 60 * 1000) {
      lastEdgeSpeechRef.current = Date.now();
      const edgePhrases = ["Where are you going?", "Stay within parameters.", "Don't leave the focus zone!", "Warning: cursor drifting."];
      const text = edgePhrases[Math.floor(Math.random() * edgePhrases.length)];
      window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text, state: 'Scary' } }));
    }
  }, [isMouseNearEdge]);

  useEffect(() => {
    if (isTimerActive && Date.now() - lastTimerSpeechRef.current > 15 * 60 * 1000) {
      lastTimerSpeechRef.current = Date.now();
      const focusPhrases = ["Focus mode engaged.", "Time to lock in.", "I'm breathing with you.", "Stay concentrated."];
      const text = focusPhrases[Math.floor(Math.random() * focusPhrases.length)];
      window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text, state: 'Focus' } }));
    }
  }, [isTimerActive]);

  useEffect(() => {
    if (isFirstLaunch) {
      const timer = setTimeout(() => {
        setState('Question');
        setSpeech('Hello! What is your name?');
        playSpeech('Hello! What is your name?', 'Question');
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        const hour = new Date().getHours();
        let greeting = "Hello!";
        if (hour >= 5 && hour < 12) greeting = "Good morning! Ready to focus?";
        else if (hour >= 12 && hour < 18) greeting = "Good afternoon! Keep it up.";
        else if (hour >= 18 && hour < 22) greeting = "Good evening! Wrapping up soon?";
        else greeting = "Working late? I'm here with you.";
        window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text: greeting, state: 'Greeting' } }));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isFirstLaunch]);

  useEffect(() => {
    if (clickCount > 0) {
      const t = setTimeout(() => setClickCount(0), 1000);
      return () => clearTimeout(t);
    }
  }, [clickCount]);

  useEffect(() => {
    const handleRockySpeak = (e: CustomEvent) => {
      const text = e.detail.text;
      const forceState = e.detail.state;
      setSpeech(text);
      
      const lowerText = text.toLowerCase();
      let newState = forceState || 'Idle';
      
      if (!forceState) {
        if (/(amaze|success|fist-bump|earned|good|great)/.test(lowerText)) newState = 'Amaze';
        else if (/(work|study|focus|task|engaged|scanning)/.test(lowerText)) newState = 'Focus';
        else if (/(scary|stop|fail|drift|error|warning)/.test(lowerText)) newState = 'Scary';
        else if (/(question|name\?|ready\?|input\?|break\?)/.test(lowerText)) newState = 'Question';
        else if (/(hello|welcome|human|nominal)/.test(lowerText)) newState = 'Greeting';
      }
      
      setState(newState);
      playSpeech(text, newState);
      
      setTimeout(() => {
        setSpeech('');
        setState('Idle');
      }, Math.max(3000, text.length * 100));
    };

    window.addEventListener('rocky-speak', handleRockySpeak as EventListener);
    return () => window.removeEventListener('rocky-speak', handleRockySpeak as EventListener);
  }, []);

  useEffect(() => {
    const idleSpeakInterval = setInterval(() => {
      if (state === 'Idle' && !speech && !isFirstLaunch && Math.random() > 0.5 && !isNapping && !isTabHidden) {
        const phrase = getUniquePhrase('idle') as { text: string, state: string };
        window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text: phrase.text, state: phrase.state } }));
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(idleSpeakInterval);
  }, [state, speech, isFirstLaunch, isNapping, isTabHidden]);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (!isNapping && !isTabHidden && (state === 'Idle' || state === 'Greeting')) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, Math.random() * 5000 + 5000);
    return () => clearInterval(blinkInterval);
  }, [state, isNapping, isTabHidden]);

  const handlePetting = (e: React.MouseEvent) => {
    const now = Date.now();
    const dt = now - petRef.current.lastTime;
    
    if (dt > 500) {
      petRef.current.accum = 0;
    } else if (dt > 0) {
      const dx = Math.abs(e.clientX - petRef.current.lastX);
      const dy = Math.abs(e.clientY - petRef.current.lastY);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      petRef.current.accum += distance;
      
      if (petRef.current.accum > 1500 && !isPetted && !isDizzy) {
        setIsPetted(true);
        window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text: "Purrrrr...", state: "Happy" } }));
        playAudio('Purr');
        setTimeout(() => { setIsPetted(false); petRef.current.accum = 0; }, 3000);
      }
    }
    
    petRef.current.lastX = e.clientX;
    petRef.current.lastY = e.clientY;
    petRef.current.lastTime = now;
  };

  const handleClick = () => {
    if (isNapping || isTabHidden) return;
    
    setClickCount(prev => prev + 1);
    if (clickCount >= 4) {
      setIsDizzy(true);
      setClickCount(0);
      window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text: "Whoa... too fast...", state: "Dizzy" } }));
      playAudio('Dizzy');
      setTimeout(() => setIsDizzy(false), 4000);
      return;
    }
    
    setIsJittering(true);
    setIsBlinking(true);
    
    setTimeout(() => {
      setIsBlinking(false);
      setIsJittering(false);
    }, 200);
    
    if (speech) {
      playSpeech(speech, state);
      return;
    }

    if (!isFirstLaunch) {
        const randomPhrase = getUniquePhrase('click') as string;
        window.dispatchEvent(new CustomEvent('rocky-speak', { detail: { text: randomPhrase } }));
    } else {
        playAudio('Click');
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      localStorage.setItem('rocky_username', inputValue.trim());
      setUserName(inputValue.trim());
      setIsFirstLaunch(false);
      const amazeText = `Amaze! Nice to meet you, ${inputValue.trim()}!`;
      setSpeech(amazeText);
      setState('Amaze');
      playSpeech(amazeText, 'Amaze');
      setTimeout(() => {
        setSpeech('');
        setState('Idle');
      }, 3000);
    }
  };

  let effectiveState = state;
  if (isDizzy) effectiveState = 'Dizzy';
  else if (isPetted) effectiveState = 'Happy';
  else if (isTabHidden || isNapping) effectiveState = 'Sleepy';
  else if (isMouseNearEdge) effectiveState = 'Scary';
  else if (isTyping) effectiveState = 'Focus';

  const leftEyePoints = isBlinking ? "60,93 100,93 100,97 60,97" :
    effectiveState === 'Dizzy' ? "70,80 90,80 90,100 70,100" :
    effectiveState === 'Amaze' ? "60,60 100,60 100,120 60,120" :
    effectiveState === 'Focus' ? "60,85 100,85 100,95 60,95" :
    effectiveState === 'Scary' ? "60,80 100,95 100,120 60,120" :
    effectiveState === 'Question' ? "60,70 100,70 100,120 60,120" :
    effectiveState === 'Greeting' ? "60,75 100,75 100,120 60,120" :
    effectiveState === 'Happy' ? "60,85 80,75 100,85 100,120 60,120" :
    effectiveState === 'Thinking' ? "60,70 100,60 100,120 60,120" :
    effectiveState === 'Sleepy' ? "60,90 100,90 100,120 60,120" :
    effectiveState === 'Alert' ? "60,50 100,50 100,120 60,120" :
    "60,75 100,75 100,120 60,120";

  const rightEyePoints = isBlinking ? "110,93 150,93 150,97 110,97" :
    effectiveState === 'Dizzy' ? "120,80 140,80 140,100 120,100" :
    effectiveState === 'Amaze' ? "110,60 150,60 150,120 110,120" :
    effectiveState === 'Focus' ? "110,85 150,85 150,95 110,95" :
    effectiveState === 'Scary' ? "110,95 150,80 150,120 110,120" :
    effectiveState === 'Question' ? "110,85 150,85 150,120 110,120" :
    effectiveState === 'Greeting' ? "110,75 150,75 150,120 110,120" :
    effectiveState === 'Happy' ? "110,85 130,75 150,85 150,120 110,120" :
    effectiveState === 'Thinking' ? "110,70 150,60 150,120 110,120" :
    effectiveState === 'Sleepy' ? "110,90 150,90 150,120 110,120" :
    effectiveState === 'Alert' ? "110,50 150,50 150,120 110,120" :
    "110,75 150,75 150,120 110,120";

  const currentMouseOffset = isTyping ? { x: -10, y: 0 } : mouseOffset;

  return (
    <motion.div 
      drag
      dragConstraints={dragConstraints}
      dragMomentum={false}
      className="hidden md:block fixed bottom-4 right-4 w-40 h-40 z-[9999] cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
      onClick={handleClick}
      onMouseMove={handlePetting}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        handlePetting({ clientX: touch.clientX, clientY: touch.clientY } as any);
      }}
      whileDrag={{ scale: 1.05 }}
    >
      <motion.div
        className="w-full h-full pointer-events-none"
        animate={
          isHopping ? { y: [0, -40, 0] } :
          isJittering ? { x: [-2, 2, -2, 2, 0] } : 
          effectiveState === 'Amaze' ? { y: [0, -15, 0] } : 
          effectiveState === 'Scary' ? { x: isMouseNearEdge ? (mouseOffset.x > 0 ? 5 : -5) : 0 } :
          isTyping ? { scale: 1.05, y: 5 } :
          isNapping ? { scale: [1, 0.95, 1] } :
          { y: 0, x: 0, scale: 1 }
        }
        transition={{ 
          duration: isNapping ? 4 : isHopping ? 0.5 : isJittering ? 0.2 : 0.5,
          repeat: isNapping ? Infinity : 0,
          ease: isHopping ? "easeOut" : "easeInOut"
        }}
      >
        <AnimatePresence>
        {speech && !isTabHidden && !isNapping && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9, originBottom: 1, originRight: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full right-full mb-2 mr-2 bg-white text-slate-900 px-4 py-3 rounded-2xl rounded-br-none shadow-2xl whitespace-nowrap font-medium pointer-events-auto border border-slate-200"
          >
            {isFirstLaunch && state === 'Question' ? (
              <form onSubmit={handleNameSubmit} className="flex gap-2 items-center">
                <span>{speech}</span>
                <input 
                  autoFocus
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder="Your name"
                  className="bg-slate-100 px-3 py-1.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-32"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                  Save
                </button>
              </form>
            ) : (
              <span>{speech}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

        <svg width="100%" height="100%" viewBox="0 0 160 160">
          <defs>
            <filter id="rocky-glow" x="-50%" y="-50%" width="200%" height="200%">
              <motion.feGaussianBlur 
                animate={{ stdDeviation: isTimerActive ? [5, 10, 5] : 5 }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <clipPath id="left-eye-clip">
              <motion.polygon 
                animate={{ points: leftEyePoints }} 
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </clipPath>
            <clipPath id="right-eye-clip">
              <motion.polygon 
                animate={{ points: rightEyePoints }} 
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              />
            </clipPath>
          </defs>

          <motion.path 
            animate={{
              d: [
                "M 160,0 L 160,160 L 0,160 L 0,30 Q 0,0 30,0 L 160,0 Z",
                "M 160,0 L 160,160 L 0,160 L 0,35 Q 0,5 35,5 L 160,0 Z",
                "M 160,0 L 160,160 L 0,160 L 0,30 Q 0,0 30,0 L 160,0 Z"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            fill="#050505"
          />

          <motion.g 
            animate={{ 
              opacity: effectiveState === 'Amaze' ? 1 : [0.85, 1, 0.85],
              x: isHopping ? [0, 0, 0] : currentMouseOffset.x,
              y: isHopping ? [0, -30, 0] : currentMouseOffset.y,
              rotate: isDizzy ? [0, 360] : isHopping ? [0, -15, 15, 0] : 0,
              scale: isHopping ? [1, 1.2, 0.9, 1] : 1
            }}
            transition={{ 
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              x: { type: "spring", stiffness: 100, damping: 20 },
              y: isHopping ? { duration: 0.5, ease: "easeOut" } : { type: "spring", stiffness: 100, damping: 20 },
              rotate: isDizzy ? { duration: 0.5, repeat: Infinity, ease: "linear" } : isHopping ? { duration: 0.5, ease: "easeInOut" } : { type: "spring", stiffness: 100, damping: 20 },
              scale: isHopping ? { duration: 0.5, ease: "easeInOut" } : { duration: 0.2 }
            }}
            style={{ originX: "105px", originY: "95px" }}
          >
            <rect 
              x="65" y="80" width="30" height="30" rx="10" 
              fill="#FFFFFF" 
              clipPath="url(#left-eye-clip)" 
              filter="url(#rocky-glow)" 
            />
            <rect 
              x="115" y="80" width="30" height="30" rx="10" 
              fill="#FFFFFF" 
              clipPath="url(#right-eye-clip)" 
              filter="url(#rocky-glow)" 
            />
          </motion.g>
        </svg>
      </motion.div>
    </motion.div>
  );
};
