import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Copy, Play, Pause, MessageCircle, Lock, Timer, X, LogOut, Loader2, Zap } from 'lucide-react';
import { rtdb } from '../services/firebase';
import { ref, set, onValue, off, remove, get } from 'firebase/database';
import { StudyRoom as StudyRoomType, RoomMember, RoomMessage, RoomTimerState } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface StudyRoomProps {
  onClose: () => void;
  currentUser: { uid: string; displayName: string | null; photoURL: string | null; };
}

export const StudyRoom: React.FC<StudyRoomProps> = ({ onClose, currentUser }) => {
  const { accent } = useTheme();
  
  const [view, setView] = useState<'lobby' | 'room'>('lobby');
  const [roomId, setRoomId] = useState<string | null>(null);
  
  // Lobby state
  const [roomNameInput, setRoomNameInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [lobbyError, setLobbyError] = useState('');
  
  // Room state
  const [roomInfo, setRoomInfo] = useState<StudyRoomType | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [timerState, setTimerState] = useState<RoomTimerState | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  
  const [messageInput, setMessageInput] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'members' | 'timer' | 'chat'>('timer');

  const isGuest = !currentUser.uid || currentUser.uid.startsWith('guest-') || currentUser.uid.startsWith('mock-');
  const isHost = roomInfo?.hostUid === currentUser.uid;

  useEffect(() => {
    return () => {
      // Best effort cleanup on unmount for leaving logic handled below.
    };
  }, []);
  
  // RTDB Listeners for room view
  useEffect(() => {
    if (view === 'room' && roomId) {
      const infoRef = ref(rtdb, `rooms/${roomId}/info`);
      const membersRef = ref(rtdb, `rooms/${roomId}/members`);
      const timerRef = ref(rtdb, `rooms/${roomId}/timer`);
      const messagesRef = ref(rtdb, `rooms/${roomId}/messages`);
      
      onValue(infoRef, (snap) => setRoomInfo(snap.val()));
      onValue(membersRef, (snap) => {
        const vals = snap.val();
        if (vals) {
          setMembers(Object.values(vals));
        } else {
          setMembers([]);
        }
      });
      onValue(timerRef, (snap) => {
        const val = snap.val();
        if (val) setTimerState(val);
      });
      onValue(messagesRef, (snap) => {
        const vals = snap.val();
        if (vals) {
          const msgs: RoomMessage[] = Object.values(vals);
          msgs.sort((a, b) => a.timestamp - b.timestamp);
          setMessages(msgs);
        } else {
          setMessages([]);
        }
      });

      return () => {
        off(infoRef);
        off(membersRef);
        off(timerRef);
        off(messagesRef);
      };
    }
  }, [view, roomId]);

  // Local Timer sync
  useEffect(() => {
    if (!timerState) return;

    const calculateRemaining = () => {
      if (timerState.isRunning && timerState.startedAt) {
        let elapsedSecs = (Date.now() - timerState.startedAt) / 1000;
        let rem = Math.max(0, timerState.duration - elapsedSecs);
        setRemainingTime(rem);
        
        if (rem === 0 && isHost) {
           const nextMode = timerState.mode === 'pomodoro' ? 'break' : 'pomodoro';
           const nextDuration = nextMode === 'pomodoro' ? 1500 : 300;
           set(ref(rtdb, `rooms/${roomId}/timer`), {
             mode: nextMode,
             startedAt: Date.now(),
             duration: nextDuration,
             isRunning: true
           });
        }
      } else {
        setRemainingTime(timerState.duration);
      }
    };

    calculateRemaining();
    const iv = setInterval(calculateRemaining, 1000);
    return () => clearInterval(iv);
  }, [timerState, isHost, roomId]);

  useEffect(() => {
    const handleUnload = () => {
       if (roomId && currentUser.uid) {
         remove(ref(rtdb, `rooms/${roomId}/members/${currentUser.uid}`)).catch(() => {});
       }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
       window.removeEventListener('beforeunload', handleUnload);
       handleUnload();
    };
  }, [roomId, currentUser.uid]);

  const handleCreateRoom = async () => {
    if (isGuest) return;
    try {
      setLobbyError('');
      const rId = crypto.randomUUID();
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const name = roomNameInput.trim() || 'My Study Room';
      
      await set(ref(rtdb, `rooms/${rId}/info`), {
        id: rId,
        name,
        code,
        hostUid: currentUser.uid,
        createdAt: Date.now()
      });
      await set(ref(rtdb, `rooms/${rId}/timer`), {
        mode: 'idle',
        startedAt: null,
        duration: 1500,
        isRunning: false
      });
      await set(ref(rtdb, `rooms/${rId}/members/${currentUser.uid}`), {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous',
        photoURL: currentUser.photoURL || '',
        isOnline: true,
        isFocusing: false,
        joinedAt: Date.now()
      });
      await set(ref(rtdb, `room_codes/${code}`), rId);
      
      setRoomId(rId);
      setView('room');
    } catch (e: any) {
      setLobbyError(e.message || 'Error creating room');
    }
  };

  const handleJoinRoom = async () => {
    if (isGuest) return;
    try {
      setLobbyError('');
      const code = joinCodeInput.trim().toUpperCase();
      if (!code) return;
      
      const codeSnap = await get(ref(rtdb, `room_codes/${code}`));
      if (!codeSnap.exists()) {
        setLobbyError('Room not found');
        return;
      }
      const rId = codeSnap.val();
      
      const membersSnap = await get(ref(rtdb, `rooms/${rId}/members`));
      if (membersSnap.exists() && Object.keys(membersSnap.val()).length >= 10) {
        setLobbyError('Room is full (max 10 members)');
        return;
      }

      await set(ref(rtdb, `rooms/${rId}/members/${currentUser.uid}`), {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous',
        photoURL: currentUser.photoURL || '',
        isOnline: true,
        isFocusing: false,
        joinedAt: Date.now()
      });
      
      setRoomId(rId);
      setView('room');
    } catch (e: any) {
      setLobbyError(e.message || 'Error joining room');
    }
  };

  const handleLeave = async () => {
    if (!roomId) return;
    try {
      const membersSnap = await get(ref(rtdb, `rooms/${roomId}/members`));
      const infoSnap = await get(ref(rtdb, `rooms/${roomId}/info`));
      
      if (membersSnap.exists()) {
        const mems = membersSnap.val();
        delete mems[currentUser.uid];
        const remainingUids = Object.keys(mems);
        
        await remove(ref(rtdb, `rooms/${roomId}/members/${currentUser.uid}`));
        
        if (remainingUids.length === 0) {
          if (infoSnap.exists()) {
             await remove(ref(rtdb, `room_codes/${infoSnap.val().code}`));
          }
          await remove(ref(rtdb, `rooms/${roomId}`));
        } else if (infoSnap.exists() && infoSnap.val().hostUid === currentUser.uid) {
          await set(ref(rtdb, `rooms/${roomId}/info/hostUid`), remainingUids[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    setRoomId(null);
    setView('lobby');
    setRoomInfo(null);
    setMembers([]);
    setTimerState(null);
    setMessages([]);
  };

  const handleClose = () => {
    if (view === 'room') {
       handleLeave().then(() => onClose());
    } else {
       onClose();
    }
  };
  
  const formatTime = (secs: number) => {
    const totalSecs = Math.floor(Math.max(0, secs));
    const m = Math.floor(totalSecs / 60);
    const s = Math.floor(totalSecs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTimerAction = async () => {
    if (!isHost || !timerState) return;
    try {
      if (timerState.isRunning) {
        await set(ref(rtdb, `rooms/${roomId}/timer`), {
          mode: timerState.mode,
          startedAt: null,
          duration: remainingTime,
          isRunning: false
        });
      } else {
        await set(ref(rtdb, `rooms/${roomId}/timer`), {
          mode: timerState.mode === 'idle' ? 'pomodoro' : timerState.mode,
          startedAt: Date.now(),
          duration: timerState.duration,
          isRunning: true
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleModeSwitch = async (mode: 'pomodoro' | 'break') => {
    if (!isHost) return;
    try {
        await set(ref(rtdb, `rooms/${roomId}/timer`), {
          mode,
          startedAt: null,
          duration: mode === 'pomodoro' ? 1500 : 300,
          isRunning: false
        });
    } catch(e) {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text || !roomId || (timerState?.mode === 'pomodoro' && timerState.isRunning)) return;
    
    try {
      const msgId = crypto.randomUUID();
      await set(ref(rtdb, `rooms/${roomId}/messages/${msgId}`), {
        id: msgId,
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous',
        photoURL: currentUser.photoURL || '',
        text,
        timestamp: Date.now()
      });
      setMessageInput('');
      
      const msgsPath = ref(rtdb, `rooms/${roomId}/messages`);
      const msgsSnap = await get(msgsPath);
      if (msgsSnap.exists()) {
         const mvals = msgsSnap.val();
         let keys = Object.keys(mvals).sort((a,b) => mvals[a].timestamp - mvals[b].timestamp);
         if (keys.length > 50) {
            const toDelete = keys.slice(0, keys.length - 50);
            for (const k of toDelete) {
               await remove(ref(rtdb, `rooms/${roomId}/messages/${k}`));
            }
         }
      }
    } catch(e) {}
  };

  const handleCopy = () => {
    if (roomInfo?.code) {
      navigator.clipboard.writeText(roomInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col pointer-events-auto bg-slate-950 text-white">
      {/* Global Top Bar in Lobby */}
      {view === 'lobby' && (
        <div className="flex-none p-6 flex justify-between items-center bg-slate-950">
          <div>
            <h2 className={`text-2xl font-bold flex items-center gap-2 text-${accent}-400`}>
              <Users className={`text-${accent}-400`} /> Study Rooms
            </h2>
          </div>
          <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
      )}

      {isGuest ? (
         <div className="flex-1 flex flex-col items-center justify-center -mt-20">
             <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-400 border border-white/5 shadow-xl">
                 <Lock size={32} />
             </div>
             <p className="text-xl font-bold text-slate-300">Sign in to create or join study rooms</p>
         </div>
      ) : view === 'lobby' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-4 md:p-6 flex flex-col">
          {/* Glow behind hero */}
          <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-${accent}-500/20 rounded-full blur-[100px] pointer-events-none`} />
          
          <div className="flex-1 flex flex-col items-center justify-center min-h-[min-content] py-6">
            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 md:mb-12 relative z-10 mt-auto md:mt-0 pt-4 md:pt-0">
              <div className={`mx-auto w-16 h-16 md:w-20 md:h-20 bg-${accent}-500/10 border border-${accent}-500/20 rounded-2xl md:rounded-3xl flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_30px_rgba(var(--color-${accent}-500),0.3)]`}>
                 <Users className={`w-8 h-8 md:w-10 md:h-10 text-${accent}-400`} />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 md:mb-4 tracking-tight">Study Rooms</h1>
              <p className="text-slate-400 text-sm md:text-lg max-w-md mx-auto px-4 md:px-0">
                Study with friends in real-time. Synced Pomodoro, shared focus.
              </p>
            </motion.div>

            {/* Cards */}
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-10 shrink-0 mb-auto md:mb-0">
              {/* Create Room */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col shadow-xl">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <Zap className={`text-${accent}-400`} size={24} />
                  <h3 className="text-lg md:text-xl font-bold text-white">Create a Room</h3>
                </div>
                <div className="space-y-4 mb-6 md:mb-8 flex-1">
                  <div>
                    <input
                      type="text"
                      value={roomNameInput}
                      onChange={(e) => setRoomNameInput(e.target.value)}
                      placeholder="e.g. Physics Grind Session"
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>
                </div>
                <button onClick={handleCreateRoom} className={`w-full bg-${accent}-600 hover:bg-${accent}-500 font-bold py-3 rounded-xl transition-colors`}>
                  Create Room →
                </button>
                <p className="text-center text-slate-500 text-xs md:text-sm mt-4">You'll be the host</p>
              </motion.div>

              {/* Join Room */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col shadow-xl">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <Users className={`text-${accent}-400`} size={24} />
                  <h3 className="text-lg md:text-xl font-bold text-white">Join a Room</h3>
                </div>
                <div className="space-y-4 mb-6 md:mb-8 flex-1">
                  <div>
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="CODE"
                      maxLength={6}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 font-mono text-center uppercase tracking-widest text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 transition-colors"
                    />
                  </div>
                  {lobbyError && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm font-medium text-center">
                      {lobbyError}
                    </motion.p>
                  )}
                </div>
                <button onClick={handleJoinRoom} disabled={!joinCodeInput} className="w-full bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:hover:bg-white/10 font-bold py-3 rounded-xl transition-colors">
                  Join Room →
                </button>
                <p className="text-center text-slate-500 text-xs md:text-sm mt-4">Get the code from your friend</p>
              </motion.div>
            </div>
            
            <div className="mt-8 text-center text-xs md:text-sm text-slate-600 font-medium">
              Up to 10 members per room
            </div>
          </div>
        </div>
      ) : roomInfo ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* ROOM TOP BAR */}
          <div className="h-16 flex-none px-4 md:px-6 bg-slate-950 border-b border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-4">
               <h3 className="text-lg font-bold text-white tracking-tight">{roomInfo.name}</h3>
               <div className="hidden sm:flex items-center gap-2">
                 <span className="font-mono bg-slate-800 px-3 py-1 text-sm rounded-lg border border-white/10 text-cyan-400 tracking-widest transition-colors duration-200">
                   {copied ? "COPIED! ✓" : roomInfo.code}
                 </span>
                 <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/5 transition-colors">
                    <Copy size={16} />
                 </button>
               </div>
             </div>
             <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-white/5 rounded-full text-sm font-medium text-slate-300">
                  <Users size={14} className={`text-${accent}-400`} /> {members.length} members
                </div>
                <button onClick={handleLeave} className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 font-bold text-sm transition-colors">
                  <LogOut size={16} /> Leave
                </button>
             </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
             
             {/* LEFT PANEL - Members */}
             <div className={`w-full md:w-52 md:border-r border-white/5 bg-slate-950/50 flex-col shrink-0 transition-transform ${mobileTab === 'members' ? 'flex absolute inset-0 z-10 md:relative' : 'hidden md:flex'}`}>
               <div className="p-4 flex-none border-b border-white/5">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In this room</h4>
               </div>
               <div className="flex-1 overflow-y-auto p-3 space-y-2 relative custom-scrollbar">
                  {members.map(m => {
                     const mHost = roomInfo?.hostUid === m.uid;
                     return (
                       <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={m.uid} className="bg-slate-900/40 rounded-xl p-3 border border-white/5 flex items-center gap-3">
                          <div className="relative shrink-0">
                             {m.photoURL ? (
                                 <img src={m.photoURL} alt={m.displayName} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                             ) : (
                                 <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-white/10">
                                     {m.displayName?.[0] || '?'}
                                 </div>
                             )}
                             <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${m.isFocusing ? 'bg-cyan-400 animate-pulse' : m.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                          </div>
                          <div className="overflow-hidden flex-1">
                             <div className="text-sm font-medium flex items-center gap-1 text-slate-200">
                                <span className="truncate">{m.displayName}</span>
                                {mHost && <Crown size={12} className="text-amber-400 shrink-0" />}
                             </div>
                             <div className="mt-0.5 flex flex-wrap gap-1">
                                {m.isFocusing ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[9px] font-bold tracking-wider">FOCUSING</span>
                                ) : (
                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest ${m.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                    {m.isOnline ? 'ONLINE' : 'IDLE'}
                                  </span>
                                )}
                             </div>
                          </div>
                       </motion.div>
                     );
                  })}
               </div>
             </div>

             {/* CENTER PANEL - Timer */}
             <div className={`flex-1 flex-col items-center justify-center bg-slate-950 p-6 relative transition-transform ${mobileTab === 'timer' ? 'flex absolute inset-0 z-10 md:relative' : 'hidden md:flex'}`}>
                
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 w-full px-4">
                   <div className="flex gap-1 bg-slate-800/80 rounded-full p-1 border border-white/10 max-w-full overflow-x-auto custom-scrollbar">
                      <button 
                         onClick={() => handleModeSwitch('pomodoro')}
                         disabled={!isHost}
                         className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${(timerState?.mode === 'pomodoro' || timerState?.mode === 'idle') && timerState?.mode !== 'break' ? `bg-${accent}-600 text-white shadow-lg` : 'text-slate-400 hover:text-white'} ${!isHost && 'opacity-70 cursor-not-allowed'}`}
                      >
                         🍅 Pomodoro
                      </button>
                      <button 
                         onClick={() => handleModeSwitch('break')}
                         disabled={!isHost}
                         className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${timerState?.mode === 'break' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'} ${!isHost && 'opacity-70 cursor-not-allowed'}`}
                      >
                         ☕ Break
                      </button>
                   </div>
                   {!isHost && <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase text-center">Host controls the timer</span>}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl px-4">
                   
                   <motion.div 
                      key={remainingTime} // small tick animation optional, but here we just rely on transition
                      className={`text-[6rem] sm:text-[8rem] md:text-[10rem] lg:text-[12rem] font-mono font-bold leading-none tracking-tighter mb-8 font-variant-numeric-tabular transition-colors duration-500 
                      ${timerState?.mode === 'pomodoro' || timerState?.mode === 'idle' ? `text-${accent}-400 drop-shadow-[0_0_50px_rgba(var(--color-${accent}-500),0.3)]` : 'text-emerald-400 drop-shadow-[0_0_50px_rgba(16,185,129,0.3)]'}`}
                   >
                      {formatTime(remainingTime)}
                   </motion.div>

                   {/* Progress bar */}
                   <div className="w-full max-w-md bg-slate-800 rounded-full h-1.5 mb-12 overflow-hidden shadow-inner">
                      <motion.div 
                         className={`h-full rounded-full transition-all duration-1000 ease-linear ${timerState?.mode === 'break' ? 'bg-emerald-400' : `bg-${accent}-500`}`}
                         style={{ width: `${timerState ? Math.max(0, Math.min(100, ((timerState.duration - remainingTime) / timerState.duration) * 100)) : 0}%` }}
                      />
                   </div>

                   <div className="flex flex-col items-center gap-4">
                      {isHost ? (
                          <button onClick={handleTimerAction} className={`flex items-center justify-center w-20 h-20 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 ${timerState?.isRunning ? 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700' : `bg-${accent}-600 text-white hover:bg-${accent}-500`}`}>
                             {timerState?.isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                          </button>
                      ) : (
                          <div className="group relative">
                             <button disabled className={`flex items-center justify-center w-20 h-20 rounded-full opacity-40 cursor-not-allowed border border-white/10 bg-slate-800 text-white`}>
                                {timerState?.isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                             </button>
                          </div>
                      )}
                      
                      <span className="text-xs font-mono text-slate-500 font-medium">
                         {(timerState?.mode === 'pomodoro' || timerState?.mode === 'idle') ? `Focus Session · ${formatTime(timerState?.duration || 1500)}` : `Break Time · ${formatTime(timerState?.duration || 300)}`}
                      </span>
                   </div>
                </div>
             </div>

             {/* RIGHT PANEL - Chat */}
             <div className={`w-full md:w-64 md:border-l border-white/5 bg-slate-950/50 flex-col shrink-0 relative transition-transform ${mobileTab === 'chat' ? 'flex absolute inset-0 z-10 md:relative' : 'hidden md:flex'}`}>
                <div className="flex-none p-4 border-b border-white/5 flex items-center justify-between">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chat</h4>
                   {timerState?.mode === 'pomodoro' ? (
                     <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-md border border-white/5">
                        <Lock size={10} className="text-amber-500" />
                        <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Locked</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-md border border-white/5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
                     </div>
                   )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative custom-scrollbar">
                   {messages.length === 0 && (
                     <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-slate-500 text-sm font-medium">
                        No messages yet. Chat opens during break! ☕
                     </div>
                   )}
                   <div className="mt-auto"></div>
                   {messages.filter(m => Date.now() - m.timestamp < 24*60*60*1000).map(msg => {
                      const isOwn = msg.uid === currentUser.uid;
                      return (
                          <div key={msg.id} className={`flex flex-col max-w-[85%] break-words ${isOwn ? 'self-end' : 'self-start'}`}>
                             <span className={`text-[10px] font-medium mb-1 px-1 ${isOwn ? 'hidden' : 'text-slate-400'}`}>
                                {msg.displayName}
                             </span>
                             <div className={`px-4 py-2.5 text-sm ${isOwn ? `bg-${accent}-500/20 text-${accent}-100 rounded-2xl rounded-tr-sm` : 'bg-slate-800 text-white rounded-2xl rounded-tl-sm'}`}>
                                {msg.text}
                             </div>
                             <span className={`text-[9px] font-medium text-slate-600 mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                      );
                   })}
                </div>

                {timerState?.mode === 'pomodoro' && (
                   <div className="absolute inset-0 top-[3.25rem] bottom-[4.25rem] z-10 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                      <Lock size={32} className="text-slate-500 mb-4" />
                      <p className="text-sm border border-white/10 bg-slate-900/50 px-4 py-2 rounded-xl text-slate-300 font-medium whitespace-nowrap">Chat unlocks during break 🎯</p>
                      <p className="text-xs text-slate-500 mt-2">Stay focused!</p>
                   </div>
                )}

                <div className="flex-none p-3 border-t border-white/5 bg-slate-900/50 relative z-20">
                   <div className="relative flex items-center gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSendMessage(e as any);
                          }
                        }}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Message..."
                        disabled={timerState?.mode === 'pomodoro'}
                        className={`flex-1 bg-slate-950 placeholder:text-slate-600 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-${accent}-500/50 transition-colors disabled:opacity-40`}
                      />
                      <button 
                        onClick={(e) => handleSendMessage(e as any)}
                        disabled={!messageInput.trim() || timerState?.mode === 'pomodoro'}
                        className={`p-2.5 rounded-xl transition-colors shrink-0 disabled:opacity-40 flex items-center justify-center disabled:bg-slate-800 disabled:text-slate-500 bg-${accent}-600 text-white hover:bg-${accent}-500`}
                      >
                         <MessageCircle size={18} />
                      </button>
                   </div>
                </div>
             </div>

          </div>

          {/* MOBILE TAB BAR */}
          <div className="md:hidden flex-none h-16 border-t border-white/5 bg-slate-950 flex items-center px-2">
             {[
               { id: 'members', icon: Users, label: 'Members' },
               { id: 'timer', icon: Timer, label: 'Timer' },
               { id: 'chat', icon: MessageCircle, label: 'Chat' }
             ].map(tab => {
                const active = mobileTab === tab.id;
                const Icon = tab.icon;
                return (
                   <button
                     key={tab.id}
                     onClick={() => setMobileTab(tab.id as any)}
                     className={`flex-1 flex flex-col items-center justify-center h-full gap-1 transition-colors ${active ? `text-${accent}-400` : 'text-slate-500 hover:text-slate-300'}`}
                   >
                      <div className={`p-1 rounded-full ${active ? `bg-${accent}-500/10` : ''}`}>
                         <Icon size={20} />
                      </div>
                      <span className="text-[10px] font-bold">{tab.label}</span>
                   </button>
                );
             })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className={`animate-spin text-${accent}-500 mb-4`} size={32} />
          <p className="text-slate-400 font-medium animate-pulse">Loading room...</p>
        </div>
      )}
    </div>
  );
};
