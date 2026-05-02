const fs = require('fs');

let fileContent = fs.readFileSync('components/StudyRoom.tsx', 'utf8');

// Replacement 1: Imports
fileContent = fileContent.replace(
`import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Copy, Play, Pause, MessageCircle, Lock, Timer, X, LogOut, Loader2, Zap } from 'lucide-react';`,
`import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Copy, Play, Pause, MessageCircle, Lock, Timer, X, LogOut, Loader2, Zap, Target, Trophy, Volume2, VolumeX, Settings } from 'lucide-react';`
);

// Replacement 2: States
fileContent = fileContent.replace(
`  const [messageInput, setMessageInput] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'members' | 'timer' | 'chat'>('timer');

  const isGuest = !currentUser.uid || currentUser.uid.startsWith('guest-') || currentUser.uid.startsWith('mock-');`,
`  const [messageInput, setMessageInput] = useState('');
  const [remainingTime, setRemainingTime] = useState(0);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'members' | 'timer' | 'chat' | 'leaderboard'>('timer');

  const [mySubject, setMySubject] = useState('');
  const [editingSubject, setEditingSubject] = useState(false);
  
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedMode, setCompletedMode] = useState<'pomodoro'|'break'>('pomodoro');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  
  const [isMuted, setIsMuted] = useState(false);
  
  const [roomGoal, setRoomGoal] = useState<{target: number, completed: number} | null>(null);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput, setGoalInput] = useState('4');
  
  const [showSettings, setShowSettings] = useState(false);
  const [pomoDuration, setPomoDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  
  const [memberStats, setMemberStats] = useState<Record<string, number>>({});

  const isGuest = !currentUser.uid || currentUser.uid.startsWith('guest-') || currentUser.uid.startsWith('mock-');`
);

// Replacement 3: Handlers and local timer sync
fileContent = fileContent.replace(
`      onValue(messagesRef, (snap) => {
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
           set(ref(rtdb, \`rooms/\${roomId}/timer\`), {
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
  }, [timerState, isHost, roomId]);`,
`      onValue(messagesRef, (snap) => {
        const vals = snap.val();
        if (vals) {
          const msgs: RoomMessage[] = Object.values(vals);
          msgs.sort((a, b) => a.timestamp - b.timestamp);
          setMessages(msgs);
        } else {
          setMessages([]);
        }
      });
      const goalRef = ref(rtdb, \`rooms/\${roomId}/goal\`);
      onValue(goalRef, (snap) => setRoomGoal(snap.val()));

      return () => {
        off(infoRef);
        off(membersRef);
        off(timerRef);
        off(messagesRef);
        off(goalRef);
      };
    }
  }, [view, roomId]);

  const playTimerSound = useCallback(() => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 1);
    } catch (e) {
      console.warn('Sound not available', e);
    }
  }, [isMuted]);

  const updateActivity = useCallback(async () => {
    if (!roomId || !currentUser.uid) return;
    await set(ref(rtdb, \`rooms/\${roomId}/members/\${currentUser.uid}/lastActive\`), Date.now());
  }, [roomId, currentUser.uid]);

  const lastActivityUpdate = useRef(0);
  const throttledUpdateActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityUpdate.current > 30000) {
      lastActivityUpdate.current = now;
      updateActivity();
    }
  }, [updateActivity]);

  useEffect(() => {
    if (members.length === 0) return;
    members.forEach(async member => {
      const snap = await get(ref(rtdb, \`users/\${member.uid}/publicStatus/todayBaseMs\`));
      if (snap.exists()) {
        setMemberStats(prev => ({
          ...prev,
          [member.uid]: snap.val()
        }));
      }
    });
  }, [members]);

  // Local Timer sync
  useEffect(() => {
    if (!timerState) return;

    const calculateRemaining = () => {
      if (timerState.isRunning && timerState.startedAt) {
        let elapsedSecs = (Date.now() - timerState.startedAt) / 1000;
        let rem = Math.max(0, timerState.duration - elapsedSecs);
        
        setRemainingTime(prevRem => {
          if (prevRem > 0 && rem === 0) {
            setCompletedMode(timerState.mode as any);
            if (timerState.mode === 'pomodoro') {
              setPomodoroCount(prev => prev + 1);
              if (isHost && roomGoal) {
                set(ref(rtdb, \`rooms/\${roomId}/goal/completed\`), (roomGoal.completed || 0) + 1);
              }
            }
            setShowCompletion(true);
            setTimeout(() => setShowCompletion(false), 3000);
            playTimerSound();
            
            if (isHost) {
               const nextMode = timerState.mode === 'pomodoro' ? 'break' : 'pomodoro';
               const nextDuration = nextMode === 'pomodoro' ? pomoDuration * 60 : breakDuration * 60;
               set(ref(rtdb, \`rooms/\${roomId}/timer\`), {
                 mode: nextMode,
                 startedAt: Date.now(),
                 duration: nextDuration,
                 isRunning: true
               });
            }
          }
          return rem;
        });

      } else {
        setRemainingTime(timerState.duration);
      }
    };

    calculateRemaining();
    const iv = setInterval(calculateRemaining, 1000);
    return () => clearInterval(iv);
  }, [timerState, isHost, roomId, roomGoal, pomoDuration, breakDuration, playTimerSound]);`
);


fileContent = fileContent.replace(
`  const handleModeSwitch = async (mode: 'pomodoro' | 'break') => {
    if (!isHost) return;
    try {
        await set(ref(rtdb, \`rooms/\${roomId}/timer\`), {
          mode,
          startedAt: null,
          duration: mode === 'pomodoro' ? 1500 : 300,
          isRunning: false
        });
    } catch(e) {}
  };`,
`  const handleModeSwitch = async (mode: 'pomodoro' | 'break') => {
    if (!isHost) return;
    try {
        await set(ref(rtdb, \`rooms/\${roomId}/timer\`), {
          mode,
          startedAt: null,
          duration: mode === 'pomodoro' ? pomoDuration * 60 : breakDuration * 60,
          isRunning: false
        });
    } catch(e) {}
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if (!roomId || !currentUser.uid) return;
    const reactionRef = ref(rtdb, \`rooms/\${roomId}/messages/\${msgId}/reactions/\${emoji}\`);
    const snap = await get(reactionRef);
    const uids: string[] = snap.val() || [];
    
    if (uids.includes(currentUser.uid)) {
      await set(reactionRef, uids.filter(uid => uid !== currentUser.uid));
    } else {
      await set(reactionRef, [...uids, currentUser.uid]);
    }
  };`
);

// Container wrapper for throttledUpdateActivity
fileContent = fileContent.replace(
  `<div className="w-full h-full flex flex-col pointer-events-auto bg-slate-950 text-white">`,
  `<div className="w-full h-full flex flex-col pointer-events-auto bg-slate-950 text-white" onMouseMove={throttledUpdateActivity} onClick={throttledUpdateActivity}>`
);

// ROOM TOP BAR - add Settings and Mute
fileContent = fileContent.replace(
`             <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-white/5 rounded-full text-sm font-medium text-slate-300">
                  <Users size={14} className={\`text-\${accent}-400\`} /> {members.length} members
                </div>`,
`             <div className="flex items-center gap-4">
                {isHost && (
                  <button
                    onClick={() => setShowSettings(s => !s)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Settings size={14} className="text-slate-400" />
                  </button>
                )}
                <button
                  onClick={() => setIsMuted(m => !m)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX size={14} className="text-slate-500" /> : <Volume2 size={14} className="text-slate-400" />}
                </button>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-white/5 rounded-full text-sm font-medium text-slate-300">
                  <Users size={14} className={\`text-\${accent}-400\`} /> {members.length} members
                </div>`
);

// Settings Panel Injection below top bar
fileContent = fileContent.replace(
`          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
             
             {/* LEFT PANEL - Members */}
             <div className={\`w-full md:w-52 md:border-r border-white/5 bg-slate-950/50 flex-col shrink-0 transition-transform \${mobileTab === 'members' ? 'flex absolute inset-0 z-10 md:relative' : 'hidden md:flex'}\`}>
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
                             <div className={\`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 \${m.isFocusing ? 'bg-cyan-400 animate-pulse' : m.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}\`} />
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
                                  <span className={\`px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest \${m.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}\`}>
                                    {m.isOnline ? 'ONLINE' : 'IDLE'}
                                  </span>
                                )}
                             </div>
                          </div>
                       </motion.div>
                     );
                  })}
               </div>
             </div>`,
`          <AnimatePresence>
            {showSettings && isHost && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-white/5 bg-black/20 px-4 py-3 flex items-center gap-6 flex-wrap"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">🍅 Pomodoro</span>
                  <input
                    type="number" min="1" max="60"
                    value={pomoDuration}
                    onChange={e => setPomoDuration(parseInt(e.target.value) || 25)}
                    className="w-14 text-center bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-slate-600">min</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">☕ Break</span>
                  <input
                    type="number" min="1" max="30"
                    value={breakDuration}
                    onChange={e => setBreakDuration(parseInt(e.target.value) || 5)}
                    className="w-14 text-center bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-slate-600">min</span>
                </div>
                <button
                  onClick={async () => {
                    await set(ref(rtdb, \`rooms/\${roomId}/timer\`), {
                      mode: 'pomodoro',
                      startedAt: null,
                      duration: pomoDuration * 60,
                      isRunning: false
                    });
                    setShowSettings(false);
                  }}
                  className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg hover:bg-cyan-500/30 transition-colors"
                >
                  Apply
                </button>
                <span className="text-[10px] text-slate-600">Only host can change durations</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
             
             {/* LEFT PANEL - Members & Leaderboard */}
             <div className={\`w-full md:w-52 md:border-r border-white/5 bg-slate-950/50 flex-col shrink-0 transition-transform \${['members', 'leaderboard'].includes(mobileTab) ? 'flex absolute inset-0 z-10 md:relative' : 'hidden md:flex'}\`}>
               
               {/* Members Section (Hidden on mobile if leaderboard selected) */}
               <div className={\`flex-1 flex-col overflow-hidden min-h-0 \${mobileTab === 'leaderboard' ? 'hidden md:flex' : 'flex'}\`}>
                 <div className="p-4 flex-none border-b border-white/5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In this room</h4>
                 </div>
                 <div className="flex-1 overflow-y-auto p-3 space-y-2 relative custom-scrollbar">
                    {members.map(m => {
                       const mHost = roomInfo?.hostUid === m.uid;
                       const isIdle = m.lastActive ? Date.now() - m.lastActive > 300000 : false;
                       const isMe = m.uid === currentUser.uid;
                       return (
                         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={m.uid} className={\`bg-slate-900/40 rounded-xl p-3 border border-white/5 flex flex-col gap-2 \${isIdle ? 'opacity-40' : 'opacity-100'}\`}>
                            <div className="flex items-center gap-3">
                               <div className="relative shrink-0">
                                  {m.photoURL ? (
                                      <img src={m.photoURL} alt={m.displayName} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                                  ) : (
                                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-white/10">
                                          {m.displayName?.[0] || '?'}
                                      </div>
                                  )}
                                  <div className={\`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 \${m.isFocusing ? 'bg-cyan-400 animate-pulse' : !isIdle && m.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}\`} />
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
                                       <span className={\`px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest \${isIdle ? 'bg-slate-800 text-slate-600' : m.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}\`}>
                                         {isIdle ? 'IDLE' : m.isOnline ? 'ONLINE' : 'OFFLINE'}
                                       </span>
                                     )}
                                  </div>
                               </div>
                            </div>
                            
                            {/* CURRENT SUBJECT */}
                            {isMe ? (
                              editingSubject ? (
                                <input
                                  autoFocus
                                  value={mySubject}
                                  onChange={e => setMySubject(e.target.value)}
                                  onBlur={async () => {
                                    setEditingSubject(false);
                                    if (roomId && currentUser.uid) {
                                      await set(ref(rtdb, \`rooms/\${roomId}/members/\${currentUser.uid}/currentSubject\`), mySubject);
                                      throttledUpdateActivity();
                                    }
                                  }}
                                  onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                                  className="text-[10px] bg-slate-800 border border-white/10 rounded-md px-2 py-1 text-white w-full mt-1 focus:outline-none focus:border-cyan-500"
                                  placeholder="What are you studying?"
                                  maxLength={30}
                                />
                              ) : (
                                <div 
                                  onClick={() => setEditingSubject(true)}
                                  className="text-[10px] cursor-pointer hover:bg-white/10 text-slate-400 truncate bg-white/5 border border-white/5 px-2 py-0.5 rounded-md mt-1 transition-colors"
                                >
                                  📚 {m.currentSubject || 'Tap to set subject'}
                                </div>
                              )
                            ) : (
                              m.currentSubject && (
                                <div className="text-[10px] text-slate-400 truncate bg-white/5 border border-white/5 px-2 py-0.5 rounded-md mt-1">
                                  📚 {m.currentSubject}
                                </div>
                              )
                            )}
                         </motion.div>
                       );
                    })}
                 </div>
               </div>

               {/* Leaderboard Section (Hidden on mobile if members selected) */}
               <div className={\`flex-1 flex-col overflow-hidden border-t border-white/5 bg-slate-950/20 \${mobileTab === 'members' ? 'hidden md:flex' : 'flex'}\`}>
                 <div className="p-3 flex-none border-b border-white/5 flex items-center gap-2">
                    <Trophy size={14} className="text-amber-500" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Leaderboard</h4>
                 </div>
                 <div className="overflow-y-auto p-3 custom-scrollbar">
                  {[...members].sort((a,b) => (memberStats[b.uid] || 0) - (memberStats[a.uid] || 0)).map((member, i) => {
                    const ms = memberStats[member.uid] || 0;
                    const hours = (ms / 3600000).toFixed(1);
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={member.uid} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 mb-2 shadow-sm">
                        <span className="text-lg w-6 text-center">
                          {medals[i] || \`\${i+1}\`}
                        </span>
                        <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner" style={{background: \`hsl(\${member.uid.charCodeAt(0)*5}, 60%, 40%)\`}}>
                          {member.photoURL ? (
                            <img src={member.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            member.displayName?.[0]?.toUpperCase() || '?'
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">
                            {member.displayName}
                            {member.uid === currentUser.uid && <span className="text-cyan-400 ml-1 font-medium text-[10px]">(you)</span>}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 shrink-0">
                          {hours}h
                        </div>
                      </div>
                    );
                  })}
                 </div>
               </div>
             </div>`
);


// Room Goal
fileContent = fileContent.replace(
`                       <button 
                          onClick={() => handleModeSwitch('break')}
                          disabled={!isHost}
                          className={\`px-4 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap \${timerState?.mode === 'break' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'} \${!isHost && 'opacity-70 cursor-not-allowed'}\`}
                       >
                          ☕ Break
                       </button>
                    </div>
                    {!isHost && <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase text-center">Host controls the timer</span>}
                 </div>`,
`                       <button 
                          onClick={() => handleModeSwitch('break')}
                          disabled={!isHost}
                          className={\`px-4 py-1.5 rounded-full text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap \${timerState?.mode === 'break' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'} \${!isHost && 'opacity-70 cursor-not-allowed'}\`}
                       >
                          ☕ Break
                       </button>
                    </div>
                    {!isHost && <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase text-center">Host controls the timer</span>}
                    
                    {roomGoal && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex gap-1">
                          {Array.from({length: roomGoal.target}).map((_,i) => (
                            <div key={i} className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] \${i < roomGoal.completed ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-white/20 text-transparent'}\`}>
                              🍅
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {roomGoal.completed}/{roomGoal.target} Pomodoros
                        </span>
                      </div>
                    )}
                 </div>`
);

// Completion Overlay and Set Goal Button
fileContent = fileContent.replace(
`                 <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl px-4">
                   
                   <motion.div 
                      key={remainingTime} // small tick animation optional, but here we just rely on transition
                      className={\`text-[6rem] sm:text-[8rem] md:text-[10rem] lg:text-[12rem] font-mono font-bold leading-none tracking-tighter mb-8 font-variant-numeric-tabular transition-colors duration-500 \n                      \${timerState?.mode === 'pomodoro' || timerState?.mode === 'idle' ? \`text-\${accent}-400 drop-shadow-[0_0_50px_rgba(var(--color-\${accent}-500),0.3)]\` : 'text-emerald-400 drop-shadow-[0_0_50px_rgba(16,185,129,0.3)]'}\`}
                   >
                      {formatTime(remainingTime)}
                   </motion.div>

                   {/* Progress bar */}
                   <div className="w-full max-w-md bg-slate-800 rounded-full h-1.5 mb-12 overflow-hidden shadow-inner">
                      <motion.div 
                         className={\`h-full rounded-full transition-all duration-1000 ease-linear \${timerState?.mode === 'break' ? 'bg-emerald-400' : \`bg-\${accent}-500\`}\`}
                         style={{ width: \`\${timerState ? Math.max(0, Math.min(100, ((timerState.duration - remainingTime) / timerState.duration) * 100)) : 0}%\` }}
                      />
                   </div>

                   <div className="flex flex-col items-center gap-4">
                      {isHost ? (
                          <button onClick={handleTimerAction} className={\`flex items-center justify-center w-20 h-20 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 \${timerState?.isRunning ? 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700' : \`bg-\${accent}-600 text-white hover:bg-\${accent}-500\`}\`}>
                             {timerState?.isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                          </button>
                      ) : (
                          <div className="group relative">
                             <button disabled className={\`flex items-center justify-center w-20 h-20 rounded-full opacity-40 cursor-not-allowed border border-white/10 bg-slate-800 text-white\`}>
                                {timerState?.isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                             </button>
                          </div>
                      )}
                      
                      <span className="text-xs font-mono text-slate-500 font-medium">
                         {(timerState?.mode === 'pomodoro' || timerState?.mode === 'idle') ? \`Focus Session · \${formatTime(timerState?.duration || 1500)}\` : \`Break Time · \${formatTime(timerState?.duration || 300)}\`}
                      </span>
                   </div>
                </div>`,
`                 <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl px-4 relative">
                   
                   <AnimatePresence>
                     {showCompletion && (
                       <motion.div
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl"
                       >
                         <div className="text-center">
                           <div className="text-6xl mb-4">
                             {completedMode === 'pomodoro' ? '🍅' : '☕'}
                           </div>
                           <div className="text-2xl font-bold text-white mb-2">
                             {completedMode === 'pomodoro' ? 'Pomodoro Complete!' : 'Break Over!'}
                           </div>
                           <div className="text-slate-400 text-sm mb-4">
                             {completedMode === 'pomodoro' ? \`\${members.length} focused together 💪\` : 'Back to work! 🎯'}
                           </div>
                           {completedMode === 'pomodoro' && (
                             <div className="flex items-center justify-center gap-2">
                               {Array.from({length: pomodoroCount}).map((_,i) => (
                                 <div key={i} className="text-2xl">🍅</div>
                               ))}
                             </div>
                           )}
                           <div className="text-xs text-slate-600 mt-4">
                             Auto-continuing in 3s...
                           </div>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>

                   <motion.div 
                      key={remainingTime} // small tick animation optional, but here we just rely on transition
                      className={\`text-[6rem] sm:text-[8rem] md:text-[10rem] lg:text-[12rem] font-mono font-bold leading-none tracking-tighter mb-8 font-variant-numeric-tabular transition-colors duration-500 \n                      \${timerState?.mode === 'pomodoro' || timerState?.mode === 'idle' ? \`text-\${accent}-400 drop-shadow-[0_0_50px_rgba(var(--color-\${accent}-500),0.3)]\` : 'text-emerald-400 drop-shadow-[0_0_50px_rgba(16,185,129,0.3)]'}\`}
                   >
                      {formatTime(remainingTime)}
                   </motion.div>

                   {/* Progress bar */}
                   <div className="w-full max-w-md bg-slate-800 rounded-full h-1.5 mb-12 overflow-hidden shadow-inner">
                      <motion.div 
                         className={\`h-full rounded-full transition-all duration-1000 ease-linear \${timerState?.mode === 'break' ? 'bg-emerald-400' : \`bg-\${accent}-500\`}\`}
                         style={{ width: \`\${timerState ? Math.max(0, Math.min(100, ((timerState.duration - remainingTime) / timerState.duration) * 100)) : 0}%\` }}
                      />
                   </div>

                   <div className="flex flex-col items-center gap-4">
                      {isHost ? (
                          <button onClick={handleTimerAction} className={\`flex items-center justify-center w-20 h-20 rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 \${timerState?.isRunning ? 'bg-slate-800 text-white border border-white/10 hover:bg-slate-700' : \`bg-\${accent}-600 text-white hover:bg-\${accent}-500\`}\`}>
                             {timerState?.isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                          </button>
                      ) : (
                          <div className="group relative">
                             <button disabled className={\`flex items-center justify-center w-20 h-20 rounded-full opacity-40 cursor-not-allowed border border-white/10 bg-slate-800 text-white\`}>
                                {timerState?.isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                             </button>
                          </div>
                      )}
                      
                      <span className="text-xs font-mono text-slate-500 font-medium">
                         {(timerState?.mode === 'pomodoro' || timerState?.mode === 'idle') ? \`Focus Session · \${formatTime(timerState?.duration || 1500)}\` : \`Break Time · \${formatTime(timerState?.duration || 300)}\`}
                      </span>

                      {/* Set Goal Button */}
                      {isHost && (
                        <div className="mt-4 flex flex-col items-center">
                          <button
                            onClick={() => setShowGoalInput(true)}
                            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                          >
                            <Target size={10} /> {roomGoal ? 'Change Goal' : 'Set Session Goal'}
                          </button>
                          {showGoalInput && (
                            <div className="flex items-center gap-2 mt-2">
                              <input
                                type="number" min="1" max="12"
                                value={goalInput}
                                onChange={e => setGoalInput(e.target.value)}
                                className="w-16 text-center bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
                              />
                              <span className="text-xs text-slate-500">Pomodoros</span>
                              <button
                                onClick={async () => {
                                  const target = Math.min(12, Math.max(1, parseInt(goalInput) || 4));
                                  await set(ref(rtdb, \`rooms/\${roomId}/goal\`), {
                                    target,
                                    completed: roomGoal?.completed || 0
                                  });
                                  setShowGoalInput(false);
                                }}
                                className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-lg hover:bg-cyan-500/30 transition-colors"
                              >
                                Set
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                   </div>
                </div>`
);

// Chat Reactions
fileContent = fileContent.replace(
`                    {messages.filter(m => Date.now() - m.timestamp < 24*60*60*1000).map(msg => {
                      const isOwn = msg.uid === currentUser.uid;
                      return (
                          <div key={msg.id} className={\`flex flex-col max-w-[85%] break-words \${isOwn ? 'self-end' : 'self-start'}\`}>
                             <span className={\`text-[10px] font-medium mb-1 px-1 \${isOwn ? 'hidden' : 'text-slate-400'}\`}>
                                {msg.displayName}
                             </span>
                             <div className={\`px-4 py-2.5 text-sm \${isOwn ? \`bg-\${accent}-500/20 text-\${accent}-100 rounded-2xl rounded-tr-sm\` : 'bg-slate-800 text-white rounded-2xl rounded-tl-sm'}\`}>
                                {msg.text}
                             </div>
                             <span className={\`text-[9px] font-medium text-slate-600 mt-1 px-1 \${isOwn ? 'text-right' : 'text-left'}\`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                      );
                   })}`,
`                    {messages.filter(m => Date.now() - m.timestamp < 24*60*60*1000).map(msg => {
                      const isOwn = msg.uid === currentUser.uid;
                      return (
                          <div key={msg.id} className={\`flex flex-col max-w-[85%] break-words \${isOwn ? 'self-end' : 'self-start'}\`}>
                             <span className={\`text-[10px] font-medium mb-1 px-1 flex items-center gap-2 \${isOwn ? 'hidden' : 'text-slate-400'}\`}>
                                {msg.displayName}
                             </span>
                             <div className="relative group/msg flex items-center gap-2">
                               {isOwn && (
                                 <div className="relative group/react order-1">
                                   <button className="opacity-0 group-hover/msg:opacity-100 text-[10px] text-slate-500 hover:text-slate-300 transition-all px-1">+</button>
                                   <div className="absolute bottom-full right-0 mb-1 hidden group-hover/react:flex gap-1 bg-slate-800 border border-white/10 rounded-xl p-1.5 z-10 shadow-xl">
                                     {['👍','🔥','💪','😂','❤️'].map(emoji => (
                                       <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-sm hover:scale-125 transition-transform">{emoji}</button>
                                     ))}
                                   </div>
                                 </div>
                               )}
                               <div className={\`px-4 py-2.5 text-sm \${isOwn ? \`bg-\${accent}-500/20 text-\${accent}-100 rounded-2xl rounded-tr-sm order-2\` : 'bg-slate-800 text-white rounded-2xl rounded-tl-sm order-2'}\`}>
                                  {msg.text}
                               </div>
                               {!isOwn && (
                                 <div className="relative group/react order-3">
                                   <button className="opacity-0 group-hover/msg:opacity-100 text-[10px] text-slate-500 hover:text-slate-300 transition-all px-1">+</button>
                                   <div className="absolute bottom-full left-0 mb-1 hidden group-hover/react:flex gap-1 bg-slate-800 border border-white/10 rounded-xl p-1.5 z-10 shadow-xl">
                                     {['👍','🔥','💪','😂','❤️'].map(emoji => (
                                       <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-sm hover:scale-125 transition-transform">{emoji}</button>
                                     ))}
                                   </div>
                                 </div>
                               )}
                             </div>
                             <div className={\`mt-1 flex flex-wrap gap-1 \${isOwn ? 'justify-end' : 'justify-start'}\`}>
                               {msg.reactions && Object.entries(msg.reactions).filter(([_, uids]) => uids.length > 0).map(([emoji, uids]) => (
                                 <button
                                   key={emoji}
                                   onClick={() => handleReact(msg.id, emoji)}
                                   className={\`text-[10px] px-1.5 py-0.5 rounded-md border transition-colors flex items-center gap-1 \${uids.includes(currentUser.uid) ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}\`}
                                 >
                                   {emoji} {uids.length}
                                 </button>
                               ))}
                             </div>
                             <span className={\`text-[9px] font-medium text-slate-600 mt-1 px-1 \${isOwn ? 'text-right' : 'text-left'}\`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                      );
                   })}`
);


// Mobile tab bar
fileContent = fileContent.replace(
`             {[
               { id: 'members', icon: Users, label: 'Members' },
               { id: 'timer', icon: Timer, label: 'Timer' },
               { id: 'chat', icon: MessageCircle, label: 'Chat' }
             ].map(tab => {`,
`             {[
               { id: 'members', icon: Users, label: 'Members' },
               { id: 'timer', icon: Timer, label: 'Timer' },
               { id: 'chat', icon: MessageCircle, label: 'Chat' },
               { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' }
             ].map(tab => {`
);

fs.writeFileSync('components/StudyRoom.tsx', fileContent);

console.log('Replacements completed successfully.');
