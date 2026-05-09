import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Crown, Copy, Play, Pause, MessageCircle, Lock, Timer, X, LogOut, Loader2, Zap, Target, Trophy, Settings, PenLine } from 'lucide-react';
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
  const [mobileTab, setMobileTab] = useState<'members' | 'timer' | 'chat' | 'leaderboard' | 'whiteboard'>('timer');

  const [mySubject, setMySubject] = useState('');
  const [editingSubject, setEditingSubject] = useState(false);
  
  const [showCompletion, setShowCompletion] = useState(false);
  const [completedMode, setCompletedMode] = useState<'pomodoro'|'break'>('pomodoro');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  
  const [roomGoal, setRoomGoal] = useState<{target: number, completed: number} | null>(null);
  const [showGoalInput, setShowGoalInput] = useState(false);
  const [goalInput, setGoalInput] = useState('4');
  
  const [showSettings, setShowSettings] = useState(false);
  const [pomoDuration, setPomoDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  
  const [memberStats, setMemberStats] = useState<Record<string, number>>({});

  // Whiteboard
  const [whiteboardPermissions, setWhiteboardPermissions] = useState<Record<string, boolean>>({});
  const [canDraw, setCanDraw] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{x:number, y:number} | null>(null);
  const [tool, setTool] = useState<'pen'|'eraser'|'text'|'rect'|'circle'|'sticky'>('pen');
  const [color, setColor] = useState('#06b6d4');
  const [brushSize, setBrushSize] = useState(3);
  const [strokes, setStrokes] = useState<any[]>([]);
  const [undoStack, setUndoStack] = useState<any[][]>([]);
  const [redoStack, setRedoStack] = useState<any[][]>([]);
  const [stickyNotes, setStickyNotes] = useState<{
    id: string; x: number; y: number; 
    text: string; color: string;
  }[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{x:number,y:number}|null>(null);
  const [images, setImages] = useState<{
    id: string; src: string; 
    x: number; y: number; w: number; h: number;
  }[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [centerTab, setCenterTab] = useState<'timer'|'board'>('timer');

  const STICKY_COLORS = [
    '#fef08a', '#bbf7d0', '#bfdbfe',
    '#fecaca', '#e9d5ff', '#fed7aa'
  ];
  const [nextStickyColor, setNextStickyColor] = useState(0);

  const [draggingImage, setDraggingImage] = useState<string|null>(null);
  const [dragOffset, setDragOffset] = useState<{x:number,y:number}>({x:0,y:0});
  const [selectedImage, setSelectedImage] = useState<string|null>(null);
  const [resizingImage, setResizingImage] = useState<string|null>(null);
  const [editingStickyId, setEditingStickyId] = useState<string|null>(null);
  const [editingStickyText, setEditingStickyText] = useState('');
  const [draggingSticky, setDraggingSticky] = useState<string|null>(null);
  const [stickyDragOffset, setStickyDragOffset] = useState<{x:number,y:number}>({x:0,y:0});

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
      const goalRef = ref(rtdb, `rooms/${roomId}/goal`);
      onValue(goalRef, (snap) => setRoomGoal(snap.val()));

      const strokesRef = ref(rtdb, `rooms/${roomId}/whiteboard/strokes`);
      onValue(strokesRef, snap => {
        const vals = snap.val();
        setStrokes(vals ? Object.values(vals) : []);
      });

      const permsRef = ref(rtdb, `rooms/${roomId}/whiteboard/permissions`);
      onValue(permsRef, snap => {
        const vals = snap.val() || {};
        setWhiteboardPermissions(vals);
      });

      const stickiesRef = ref(rtdb, `rooms/${roomId}/whiteboard/stickies`);
      onValue(stickiesRef, snap => {
        const vals = snap.val();
        setStickyNotes(vals ? Object.values(vals) : []);
      });

      const imagesRef = ref(rtdb, `rooms/${roomId}/whiteboard/images`);
      onValue(imagesRef, snap => {
        const vals = snap.val();
        setImages(vals ? Object.values(vals) : []);
      });

      return () => {
        off(infoRef);
        off(membersRef);
        off(timerRef);
        off(messagesRef);
        off(goalRef);
        off(strokesRef);
        off(permsRef);
        off(stickiesRef);
        off(imagesRef);
      };
    }
  }, [view, roomId]);

  useEffect(() => {
    if (isHost) setCanDraw(true);
    else setCanDraw(whiteboardPermissions[currentUser.uid] === true);
  }, [isHost, whiteboardPermissions, currentUser.uid]);

  const playTimerSound = useCallback(() => {
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
  }, []);

  const updateActivity = useCallback(async () => {
    if (!roomId || !currentUser.uid) return;
    await set(ref(rtdb, `rooms/${roomId}/members/${currentUser.uid}/lastActive`), Date.now());
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
      const snap = await get(ref(rtdb, `users/${member.uid}/publicStatus/todayBaseMs`));
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
                set(ref(rtdb, `rooms/${roomId}/goal/completed`), (roomGoal.completed || 0) + 1);
              }
            }
            setShowCompletion(true);
            setTimeout(() => setShowCompletion(false), 3000);
            playTimerSound();
            
            if (isHost) {
               const nextMode = timerState.mode === 'pomodoro' ? 'break' : 'pomodoro';
               const nextDuration = nextMode === 'pomodoro' ? pomoDuration * 60 : breakDuration * 60;
               set(ref(rtdb, `rooms/${roomId}/timer`), {
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
  }, [timerState, isHost, roomId, roomGoal, pomoDuration, breakDuration, playTimerSound]);

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
          duration: mode === 'pomodoro' ? pomoDuration * 60 : breakDuration * 60,
          isRunning: false
        });
    } catch(e) {}
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if (!roomId || !currentUser.uid) return;
    const reactionRef = ref(rtdb, `rooms/${roomId}/messages/${msgId}/reactions/${emoji}`);
    const snap = await get(reactionRef);
    const uids: string[] = snap.val() || [];
    
    if (uids.includes(currentUser.uid)) {
      await set(reactionRef, uids.filter(uid => uid !== currentUser.uid));
    } else {
      await set(reactionRef, [...uids, currentUser.uid]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageInput.trim();
    if (!text || !roomId) return;
    
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

  const currentStrokeRef = useRef<any[]>([]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canDraw || tool === 'text' || tool === 'sticky') return;
    isDrawingRef.current = true;
    currentStrokeRef.current = [];
    const pos = getCanvasPos(e);
    lastPosRef.current = pos;
    currentStrokeRef.current.push(pos);
  };

  const renderStrokes = useCallback((ctx: CanvasRenderingContext2D, allStrokes: any[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    allStrokes.forEach(stroke => {
      if (!stroke.points || stroke.points.length < 2) return;
      ctx.beginPath();
      const start = stroke.points[0];
      const end = stroke.points[stroke.points.length - 1];
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'rect') {
         ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (stroke.tool === 'circle') {
         const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
         ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
         ctx.stroke();
      } else {
         ctx.moveTo(start.x, start.y);
         stroke.points.forEach((pt: any) => ctx.lineTo(pt.x, pt.y));
         ctx.stroke();
      }
    });
  }, []);

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canDraw) return;
    const pos = getCanvasPos(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPosRef.current) return;
    
    currentStrokeRef.current.push(pos);

    if (tool === 'rect' || tool === 'circle') {
      const previewStroke = {
        points: currentStrokeRef.current,
        color,
        size: brushSize,
        tool
      };
      renderStrokes(ctx, [...strokes, previewStroke]);
    } else {
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tool === 'eraser' ? '#0f172a' : color;
      ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPosRef.current = pos;
    }
  };

  const endDrawing = async () => {
    if (!isDrawingRef.current || !roomId) return;
    isDrawingRef.current = false;
    
    if (currentStrokeRef.current.length > 1) {
      const strokeId = crypto.randomUUID();
      const stroke = {
        id: strokeId,
        points: currentStrokeRef.current,
        color: tool === 'eraser' ? '#0f172a' : color,
        size: tool === 'eraser' ? brushSize * 4 : brushSize,
        tool,
        uid: currentUser.uid,
        timestamp: Date.now()
      };
      setUndoStack(prev => [...prev, strokes]);
      setRedoStack([]);
      await set(ref(rtdb, `rooms/${roomId}/whiteboard/strokes/${strokeId}`), stroke);
    }
    currentStrokeRef.current = [];
    lastPosRef.current = null;
  };

  const getCanvasPos = (e: any) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderStrokes(ctx, strokes);
  }, [strokes, renderStrokes]);

  const handleUndo = async () => {
    if (undoStack.length === 0 || !roomId) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [...r, strokes]);
    setUndoStack(u => u.slice(0, -1));
    const strokesObj: Record<string,any> = {};
    prev.forEach((s: any) => { strokesObj[s.id] = s; });
    await set(ref(rtdb, `rooms/${roomId}/whiteboard/strokes`), strokesObj);
  };

  const handleRedo = async () => {
    if (redoStack.length === 0 || !roomId) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack(u => [...u, strokes]);
    setRedoStack(r => r.slice(0, -1));
    const strokesObj: Record<string,any> = {};
    next.forEach((s: any) => { strokesObj[s.id] = s; });
    await set(ref(rtdb, `rooms/${roomId}/whiteboard/strokes`), strokesObj);
  };

  const handleClearCanvas = async () => {
    if (!isHost || !roomId) return;
    setUndoStack(prev => [...prev, strokes]);
    await set(ref(rtdb, `rooms/${roomId}/whiteboard/strokes`), null);
    await set(ref(rtdb, `rooms/${roomId}/whiteboard/texts`), null);
    await set(ref(rtdb, `rooms/${roomId}/whiteboard/stickies`), null);
    await set(ref(rtdb, `rooms/${roomId}/whiteboard/cleared`), Date.now());
  };

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleCanvasClick = async (e: React.MouseEvent) => {
    if (tool !== 'text' && tool !== 'sticky') return;
    const pos = getCanvasPos(e);
    if (tool === 'text') {
      setTextPos(pos);
    } else if (tool === 'sticky' && roomId) {
      const id = crypto.randomUUID();
      const newColor = STICKY_COLORS[nextStickyColor % STICKY_COLORS.length];
      setNextStickyColor(c => c+1);
      await set(ref(rtdb, `rooms/${roomId}/whiteboard/stickies/${id}`), {
        id, x: pos.x - 75, y: pos.y - 50, 
        text: '', color: newColor,
        uid: currentUser.uid
      });
      setEditingStickyId(id);
      setEditingStickyText('');
    }
  };

  const handleTextSubmit = async () => {
    if (!textPos || !textInput.trim() || !roomId) return;
    const id = crypto.randomUUID();
    await set(ref(rtdb, `rooms/${roomId}/whiteboard/texts/${id}`), {
      id, x: textPos.x, y: textPos.y,
      text: textInput, color, size: brushSize * 4 + 8,
      uid: currentUser.uid, timestamp: Date.now()
    });
    setTextInput('');
    setTextPos(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !roomId) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const src = ev.target?.result as string;
      const id = crypto.randomUUID();
      await set(ref(rtdb, `rooms/${roomId}/whiteboard/images/${id}`), {
        id, src, x: 50, y: 50, w: 300, h: 200,
        uid: currentUser.uid
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleDrawPermission = async (uid: string) => {
    if (!isHost || !roomId) return;
    const current = whiteboardPermissions[uid] || false;
    await set(ref(rtdb, `rooms/${roomId}/whiteboard/permissions/${uid}`), !current);
  };

  const handleImageMouseDown = (e: React.MouseEvent, imgId: string) => {
    if (!canDraw) return;
    e.stopPropagation();
    e.preventDefault();
    const img = images.find(i => i.id === imgId);
    if (!img) return;
    setDraggingImage(imgId);
    setSelectedImage(imgId);
    setDragOffset({
      x: e.clientX - img.x,
      y: e.clientY - img.y
    });
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (!draggingImage || !roomId) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    setImages(prev => prev.map(i => 
      i.id === draggingImage ? {...i, x: newX, y: newY} : i
    ));
  };

  const handleImageMouseUp = async () => {
    if (!draggingImage || !roomId) return;
    const img = images.find(i => i.id === draggingImage);
    if (img) {
      await set(ref(rtdb, `rooms/${roomId}/whiteboard/images/${draggingImage}`), img);
    }
    setDraggingImage(null);
  };

  const handleDeleteImage = async (imgId: string) => {
    if (!roomId || !canDraw) return;
    await remove(ref(rtdb, `rooms/${roomId}/whiteboard/images/${imgId}`));
    setSelectedImage(null);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, imgId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingImage(imgId);
    setDragOffset({x: e.clientX, y: e.clientY});
  };

  const handleStickyMouseDown = (e: React.MouseEvent, stickyId: string) => {
    if (!canDraw) return;
    e.stopPropagation();
    const sticky = stickyNotes.find(s => s.id === stickyId);
    if (!sticky) return;
    setDraggingSticky(stickyId);
    setStickyDragOffset({
      x: e.clientX - sticky.x,
      y: e.clientY - sticky.y
    });
  };

  const handleDeleteSticky = async (id: string) => {
    if (!roomId) return;
    await remove(ref(rtdb, `rooms/${roomId}/whiteboard/stickies/${id}`));
  };

  const handleStickySave = async (id: string, text: string) => {
    const sticky = stickyNotes.find(s => s.id === id);
    if (!sticky || !roomId) return;
    await set(ref(rtdb, `rooms/${roomId}/whiteboard/stickies/${id}`), {...sticky, text});
    setEditingStickyId(null);
  };

  const WhiteboardPanel = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    return (
      <div className="flex flex-col h-full select-none">
        
        {/* Professional Toolbar */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 border-b border-white/5 overflow-x-auto no-scrollbar flex-shrink-0">
          
          {/* Tools group */}
          <div className="flex items-center gap-0.5 bg-slate-800/80 rounded-xl p-1 border border-white/5">
            {([
              {id:'pen', emoji:'✏️', title:'Pen (draw)'},
              {id:'eraser', emoji:'◻', title:'Eraser'},
              {id:'text', emoji:'T', title:'Add text'},
              {id:'rect', emoji:'▭', title:'Rectangle'},
              {id:'circle', emoji:'◯', title:'Circle'},
              {id:'sticky', emoji:'📝', title:'Sticky note'},
            ] as const).map(t => (
              <button key={t.id}
                onClick={() => canDraw && setTool(t.id)}
                disabled={!canDraw}
                title={t.title}
                className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all duration-150 font-bold ${tool === t.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-400 hover:bg-white/10 hover:text-white'} disabled:opacity-25 disabled:cursor-not-allowed`}
              >{t.emoji}</button>
            ))}
          </div>

          <div className="w-px h-6 bg-white/10 mx-0.5 flex-shrink-0" />

          {/* Color palette */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {['#ffffff','#06b6d4','#a78bfa','#f87171',
              '#34d399','#fbbf24','#fb923c','#000000'
            ].map(c => (
              <button key={c}
                onClick={() => setColor(c)}
                disabled={!canDraw}
                className={`w-5 h-5 rounded-full border-2 transition-all duration-150 flex-shrink-0 ${color === c ? 'border-white scale-125 shadow-md' : 'border-transparent hover:scale-110'}`}
                style={{background: c}}
              />
            ))}
            <input type="color" value={color}
              onChange={e => setColor(e.target.value)}
              disabled={!canDraw}
              className="w-5 h-5 rounded-full cursor-pointer border-2 border-white/20 flex-shrink-0"
              title="Custom color"
            />
          </div>

          <div className="w-px h-6 bg-white/10 mx-0.5 flex-shrink-0" />

          {/* Brush size */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[9px] text-slate-500">Size</span>
            <input type="range" min="1" max="30"
              value={brushSize}
              onChange={e => setBrushSize(parseInt(e.target.value))}
              disabled={!canDraw}
              className="w-16 accent-cyan-400 h-1"
            />
            <div 
              className="rounded-full bg-current flex-shrink-0"
              style={{
                width: Math.min(16, Math.max(4, brushSize))+'px',
                height: Math.min(16, Math.max(4, brushSize))+'px',
                background: color
              }}
            />
          </div>

          <div className="w-px h-6 bg-white/10 mx-0.5 flex-shrink-0" />

          {/* Image upload */}
          <button
            onClick={() => canDraw && imageInputRef.current?.click()}
            disabled={!canDraw}
            title="Upload image"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-[10px] text-slate-300 hover:bg-slate-700 transition-colors flex-shrink-0 disabled:opacity-25 disabled:cursor-not-allowed"
          >
            🖼️ <span className="hidden sm:inline">Image</span>
          </button>
          <input ref={imageInputRef} type="file"
            accept="image/*" onChange={handleImageUpload}
            className="hidden" />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >↩</button>
            <button onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm text-slate-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            >↪</button>
            <button onClick={handleSaveImage}
              title="Save as PNG"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-[10px] text-emerald-300 hover:bg-emerald-500/25 transition-colors"
            >💾 <span className="hidden sm:inline">Save</span></button>
            {isHost && (
              <button onClick={handleClearCanvas}
                title="Clear all (host only)"
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400 hover:bg-red-500/20 transition-colors"
              >🗑️ <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>

          {/* Draw permissions (host only) */}
          {isHost && members.filter(m => m.uid !== currentUser.uid).length > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0 ml-1 pl-1 border-l border-white/10">
              <span className="text-[9px] text-slate-600 whitespace-nowrap">Can draw:</span>
              {members
                .filter(m => m.uid !== currentUser.uid)
                .map(m => (
                  <button key={m.uid}
                    onClick={() => toggleDrawPermission(m.uid)}
                    className={`text-[9px] px-1.5 py-0.5 rounded-md border transition-colors whitespace-nowrap ${whiteboardPermissions[m.uid] ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}
                  >
                    {(m.displayName||'User').split(' ')[0]}
                    {whiteboardPermissions[m.uid] ? ' ✓' : ' +'}
                  </button>
                ))}
            </div>
          )}

          {/* Can't draw badge */}
          {!canDraw && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 flex-shrink-0">
              🔒 View only
            </div>
          )}
        </div>

        {/* Canvas container */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden bg-white"
          onMouseMove={(e) => {
            handleImageMouseMove(e);
            if (resizingImage) {
              const dx = e.clientX - dragOffset.x;
              const dy = e.clientY - dragOffset.y;
              setImages(prev => prev.map(i => 
                i.id === resizingImage 
                  ? {...i, w: Math.max(80, i.w+dx), h: Math.max(60, i.h+dy)}
                  : i
              ));
              setDragOffset({x: e.clientX, y: e.clientY});
            }
            if (draggingSticky) {
              setStickyNotes(prev => prev.map(s =>
                s.id === draggingSticky
                  ? {...s, 
                      x: e.clientX - stickyDragOffset.x,
                      y: e.clientY - stickyDragOffset.y}
                  : s
              ));
            }
          }}
          onMouseUp={async (e) => {
            await handleImageMouseUp();
            if (resizingImage && roomId) {
              const img = images.find(i => i.id === resizingImage);
              if (img) await set(ref(rtdb, `rooms/${roomId}/whiteboard/images/${resizingImage}`), img);
              setResizingImage(null);
            }
            if (draggingSticky && roomId) {
              const sticky = stickyNotes.find(s => s.id === draggingSticky);
              if (sticky) {
                await set(ref(rtdb, `rooms/${roomId}/whiteboard/stickies/${draggingSticky}`), sticky);
              }
              setDraggingSticky(null);
            }
          }}
        >
          {/* Main canvas — white background for drawing */}
          <canvas
            ref={canvasRef}
            width={1600}
            height={900}
            className="absolute inset-0 w-full h-full"
            style={{
              cursor: !canDraw ? 'default' : tool === 'eraser' ? 'cell' : tool === 'text' ? 'text' : tool === 'sticky' ? 'copy' : 'crosshair',
              touchAction: 'none',
              background: 'white'
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={endDrawing}
            onMouseLeave={endDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={endDrawing}
            onClick={handleCanvasClick}
          />

          {/* Images overlay — draggable */}
          {images.map(img => (
            <div key={img.id}
              className={`absolute group ${canDraw ? 'cursor-move' : 'cursor-default'}`}
              style={{
                left: img.x+'px', top: img.y+'px',
                width: img.w+'px', height: img.h+'px',
                zIndex: draggingImage === img.id ? 50 : 10,
                userSelect: 'none'
              }}
              onMouseDown={e => handleImageMouseDown(e, img.id)}
              onClick={() => setSelectedImage(img.id)}
            >
              <img 
                src={img.src} alt="shared"
                className="w-full h-full object-contain rounded-lg shadow-lg pointer-events-none"
                draggable={false}
              />
              {/* Selection border */}
              {selectedImage === img.id && (
                <div className="absolute inset-0 rounded-lg border-2 border-cyan-500 pointer-events-none">
                  {/* Delete button */}
                  {canDraw && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteImage(img.id);
                      }}
                      className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-400 transition-colors pointer-events-auto shadow-lg z-10"
                    >×</button>
                  )}
                  {/* Resize handle */}
                  {canDraw && (
                    <div
                      onMouseDown={e => handleResizeMouseDown(e, img.id)}
                      className="absolute -bottom-2 -right-2 w-5 h-5 rounded bg-cyan-500 cursor-se-resize flex items-center justify-center pointer-events-auto shadow-lg"
                    >
                      <div className="w-2 h-2 border-b-2 border-r-2 border-white" />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Sticky notes overlay */}
          {stickyNotes.map(sticky => (
            <div key={sticky.id}
              className="absolute group shadow-lg rounded-lg overflow-hidden"
              style={{
                left: sticky.x+'px', top: sticky.y+'px',
                width: '150px', minHeight: '120px',
                background: sticky.color,
                cursor: canDraw ? (draggingSticky === sticky.id ? 'grabbing' : 'grab') : 'default',
                zIndex: draggingSticky === sticky.id ? 50 : 20,
                userSelect: 'none'
              }}
              onMouseDown={e => handleStickyMouseDown(e, sticky.id)}
            >
              {/* Sticky header bar */}
              <div className="flex items-center justify-between px-2 py-1 bg-black/10">
                <div className="flex gap-1">
                  {STICKY_COLORS.map((c, i) => (
                    <button key={i}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!roomId || !canDraw) return;
                        await set(ref(rtdb, `rooms/${roomId}/whiteboard/stickies/${sticky.id}`), {...sticky, color: c});
                      }}
                      className="w-3 h-3 rounded-full border border-black/20 hover:scale-110 transition-transform"
                      style={{background: c}}
                    />
                  ))}
                </div>
                {canDraw && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteSticky(sticky.id);
                    }}
                    className="text-black/40 hover:text-black/70 text-xs leading-none transition-colors"
                  >×</button>
                )}
              </div>

              {/* Sticky content */}
              {editingStickyId === sticky.id ? (
                <textarea
                  autoFocus
                  value={editingStickyText}
                  onChange={e => setEditingStickyText(e.target.value)}
                  onBlur={() => handleStickySave(sticky.id, editingStickyText)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      handleStickySave(sticky.id, editingStickyText);
                    }
                  }}
                  onClick={e => e.stopPropagation()}
                  onMouseDown={e => e.stopPropagation()}
                  className="w-full p-2 text-xs text-slate-800 bg-transparent resize-none focus:outline-none min-h-[80px]"
                  placeholder="Write something..."
                />
              ) : (
                <div
                  className="p-2 text-xs text-slate-800 min-h-[80px] whitespace-pre-wrap break-words cursor-text"
                  onDoubleClick={e => {
                    e.stopPropagation();
                    if (!canDraw) return;
                    setEditingStickyId(sticky.id);
                    setEditingStickyText(sticky.text);
                  }}
                >
                  {sticky.text || (canDraw ? <span className="text-black/30 italic">Double-click to edit</span> : null)}
                </div>
              )}
            </div>
          ))}

          {/* Text input overlay */}
          {textPos && tool === 'text' && (
            <div className="absolute z-30"
              style={{
                left: textPos.x + 'px',
                top: textPos.y + 'px'
              }}
            >
              <input
                autoFocus
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleTextSubmit();
                  if (e.key === 'Escape') {
                    setTextPos(null); setTextInput('');
                  }
                }}
                className="bg-white/90 backdrop-blur border-2 border-cyan-500 rounded px-3 py-1.5 text-slate-900 text-sm font-medium focus:outline-none min-w-[150px] shadow-xl"
                placeholder="Type text, press Enter"
                style={{fontSize: Math.max(12, brushSize*3)+'px'}}
              />
            </div>
          )}

          {/* Click outside to deselect image */}
          {selectedImage && (
            <div 
              className="absolute inset-0 z-0"
              onClick={() => setSelectedImage(null)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col pointer-events-auto bg-slate-950 text-white" onMouseMove={throttledUpdateActivity} onClick={throttledUpdateActivity}>
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
               <h3 className="text-lg font-bold text-white tracking-tight truncate max-w-[80px] sm:max-w-none">{roomInfo.name}</h3>
               <div className="flex items-center gap-2">
                 <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-800 px-2 py-0.5 rounded-lg border border-white/10 tracking-widest flex-shrink-0 transition-colors duration-200">
                   {copied ? "COPIED! ✓" : roomInfo.code}
                 </span>
                 <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-white/5 transition-colors flex-shrink-0">
                    <Copy size={16} />
                 </button>
               </div>
             </div>
             <div className="flex items-center gap-4">
                {isHost && (
                  <button
                    onClick={() => setShowSettings(s => !s)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <Settings size={14} className="text-slate-400" />
                  </button>
                )}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-white/5 rounded-full text-sm font-medium text-slate-300">
                  <Users size={14} className={`text-${accent}-400`} /> {members.length} members
                </div>
                <button onClick={handleLeave} className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 font-bold text-sm transition-colors">
                  <LogOut size={16} /> Leave
                </button>
             </div>
          </div>

          <AnimatePresence>
            {showSettings && isHost && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-white/5 bg-black/20 px-4 py-3 flex items-center gap-6 flex-wrap z-20 relative"
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
                    await set(ref(rtdb, `rooms/${roomId}/timer`), {
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
                <span className="text-[10px] text-slate-600">Only host can change durations.</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
             
             {/* LEFT PANEL - Members */}
             <div className={`w-full md:w-52 md:border-r border-white/5 bg-slate-950/50 flex-col shrink-0 transition-transform ${['members', 'leaderboard'].includes(mobileTab) ? 'flex absolute inset-0 z-10 md:relative' : 'hidden md:flex'}`}>
               
               <div className={`flex-1 flex-col overflow-hidden min-h-0 ${mobileTab === 'leaderboard' ? 'hidden md:flex' : 'flex'}`}>
                 <div className="p-4 flex-none border-b border-white/5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">In this room</h4>
                 </div>
                 <div className="flex-1 overflow-y-auto p-3 space-y-2 relative custom-scrollbar">
                    {members.map(m => {
                       const mHost = roomInfo?.hostUid === m.uid;
                       const isIdle = m.lastActive ? Date.now() - m.lastActive > 300000 : false;
                       const isMe = m.uid === currentUser.uid;
                       return (
                         <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} key={m.uid} className={`bg-slate-900/40 rounded-xl p-3 border border-white/5 flex flex-col gap-2 ${isIdle ? 'opacity-40' : 'opacity-100'}`}>
                            <div className="flex items-center gap-3">
                               <div className="relative shrink-0">
                                  {m.photoURL ? (
                                      <img src={m.photoURL} alt={m.displayName} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                                  ) : (
                                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-white/10">
                                          {m.displayName?.[0] || '?'}
                                      </div>
                                  )}
                                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${m.isFocusing ? 'bg-cyan-400 animate-pulse' : (!isIdle && m.isOnline) ? 'bg-emerald-500' : 'bg-slate-500'}`} />
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
                                       <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest ${isIdle ? 'bg-slate-800 text-slate-600' : m.isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                                         {isIdle ? 'IDLE' : m.isOnline ? 'ONLINE' : 'OFFLINE'}
                                       </span>
                                     )}
                                  </div>
                               </div>
                            </div>
                            {isMe ? (
                              editingSubject ? (
                                <input
                                  autoFocus
                                  value={mySubject}
                                  onChange={e => setMySubject(e.target.value)}
                                  onBlur={async () => {
                                    setEditingSubject(false);
                                    if (roomId && currentUser.uid) {
                                      await set(ref(rtdb, `rooms/${roomId}/members/${currentUser.uid}/currentSubject`), mySubject);
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

               {/* Leaderboard Section */}
               <div className={`flex-1 flex-col overflow-hidden border-t border-white/5 bg-slate-950/20 ${mobileTab === 'members' ? 'hidden md:flex' : 'flex'}`}>
                 <div className="p-3 flex-none border-b border-white/5 flex items-center gap-2">
                    <Trophy size={14} className="text-amber-500" />
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Today's Leaderboard</h4>
                 </div>
                 <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                  {[...members].sort((a,b) => (memberStats[b.uid] || 0) - (memberStats[a.uid] || 0)).map((member, i) => {
                    const ms = memberStats[member.uid] || 0;
                    const hours = (ms / 3600000).toFixed(1);
                    const medals = ['🥇', '🥈', '🥉'];
                    return (
                      <div key={member.uid} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 mb-2 shadow-sm">
                        <span className="text-lg w-6 text-center">
                          {medals[i] || `${i+1}`}
                        </span>
                        <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-inner" style={{background: `hsl(${member.uid.charCodeAt(0)*5}, 60%, 40%)`}}>
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
             </div>

             {/* CENTER PANEL */}
             <div className={`flex-1 flex-col bg-slate-950 relative transition-transform ${['timer', 'whiteboard'].includes(mobileTab) ? 'flex absolute inset-0 z-10 md:relative' : 'hidden md:flex'}`}>
                 <div className="hidden md:flex border-b border-white/5 shrink-0 flex-none h-11">
                    {['timer','board'].map(t => (
                      <button
                        key={t}
                        onClick={() => setCenterTab(t as any)}
                        className={`flex-1 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${centerTab === t ? `text-${accent}-400 border-b-2 border-${accent}-500 bg-white/5` : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                      >
                        {t === 'timer' ? '⏱ Timer' : '🎨 Board'}
                      </button>
                    ))}
                 </div>

                 {/* Timer View */}
                 <div className={`flex-1 flex-col items-center justify-center p-6 relative ${mobileTab === 'timer' ? 'flex' : 'hidden md:flex'} ${centerTab !== 'timer' ? 'md:!hidden' : ''}`}>
                
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

                   {roomGoal && (
                     <div className="flex items-center gap-2 mt-2">
                       <div className="flex gap-1">
                         {Array.from({length: roomGoal.target}).map((_,i) => (
                           <div key={i} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${i < roomGoal.completed ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-white/20 text-transparent'}`}>
                             🍅
                           </div>
                         ))}
                       </div>
                       <span className="text-xs text-slate-500 font-mono">
                         {roomGoal.completed}/{roomGoal.target} Pomodoros
                       </span>
                     </div>
                   )}
                </div>

                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl px-4 relative">
                   
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
                             {completedMode === 'pomodoro' ? `${members.length} focused together 💪` : 'Back to work! 🎯'}
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

                      {/* Set Goal Button */}
                      {isHost && (
                        <div className="mt-4 flex flex-col items-center z-10">
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
                                  await set(ref(rtdb, `rooms/${roomId}/goal`), {
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
                </div>
             </div>

             {/* Whiteboard View */}
             <div className={`flex-1 flex-col relative w-full h-full p-0 sm:p-2 overflow-hidden ${mobileTab === 'whiteboard' ? 'flex' : 'hidden md:flex'} ${centerTab !== 'board' ? 'md:!hidden' : ''}`}>
               <WhiteboardPanel />
             </div>
           </div>

             {/* RIGHT PANEL - Chat */}
             <div className={`w-full md:w-64 md:border-l border-white/5 bg-slate-950/50 flex-col shrink-0 relative transition-transform ${mobileTab === 'chat' ? 'flex absolute inset-0 z-10 md:relative' : 'hidden md:flex'}`}>
                <div className="flex-none p-4 border-b border-white/5 flex items-center justify-between">
                   <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chat</h4>
                   <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded-md border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 relative custom-scrollbar">
                   {messages.length === 0 && (
                     <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-slate-500 text-sm font-medium">
                        No messages yet. Chat opens during break! ☕
                     </div>
                   )}
                                    {messages.filter(m => Date.now() - m.timestamp < 24*60*60*1000).map(msg => {
                      const isOwn = msg.uid === currentUser.uid;
                      return (
                          <div key={msg.id} className={`flex flex-col max-w-[85%] break-words ${isOwn ? 'self-end' : 'self-start'}`}>
                             <span className={`text-[10px] font-medium mb-1 px-1 flex items-center gap-2 ${isOwn ? 'hidden' : 'text-slate-400'}`}>
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
                               <div className={`px-4 py-2.5 text-sm ${isOwn ? `bg-${accent}-500/20 text-${accent}-100 rounded-2xl rounded-tr-sm order-2` : 'bg-slate-800 text-white rounded-2xl rounded-tl-sm order-2'}`}>
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
                             <div className={`mt-1 flex flex-wrap gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                               {msg.reactions && Object.entries(msg.reactions).filter(([_, uids]) => (uids as string[]).length > 0).map(([emoji, uids]) => (
                                 <button
                                   key={emoji}
                                   onClick={() => handleReact(msg.id, emoji)}
                                   className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-colors flex items-center gap-1 ${(uids as string[]).includes(currentUser.uid) ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                                 >
                                   {emoji} {(uids as string[]).length}
                                 </button>
                               ))}
                             </div>
                             <span className={`text-[9px] font-medium text-slate-600 mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                      );
                   })}
                </div>

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
                        className={`flex-1 bg-slate-950 placeholder:text-slate-600 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-${accent}-500/50 transition-colors disabled:opacity-40`}
                      />
                      <button 
                        onClick={(e) => handleSendMessage(e as any)}
                        disabled={!messageInput.trim()}
                        className={`p-2.5 rounded-xl transition-colors shrink-0 disabled:opacity-40 flex items-center justify-center disabled:bg-slate-800 disabled:text-slate-500 bg-${accent}-600 text-white hover:bg-${accent}-500`}
                      >
                         <MessageCircle size={18} />
                      </button>
                   </div>
                </div>
             </div>

          </div>

          {/* MOBILE TAB BAR */}
          <div className="md:hidden flex-none h-16 border-t border-white/5 bg-slate-950 flex items-center px-2 z-20">
             {[
               { id: 'members', icon: Users, label: 'Members' },
               { id: 'timer', icon: Timer, label: 'Timer' },
               { id: 'chat', icon: MessageCircle, label: 'Chat' },
               { id: 'leaderboard', icon: Trophy, label: 'Leaders' },
               { id: 'whiteboard', icon: PenLine, label: 'Board' }
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
