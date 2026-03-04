import React from 'react';
import { Bell, Volume2, LogIn, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { EkagraLogo } from './EkagraLogo';

interface AppHeaderProps {
  triggerLogoSpin: () => void;
  isLogoSpinning: boolean;
  setIsNotificationOpen: (isOpen: boolean) => void;
  unreadCount: number;
  isPlaying: boolean;
  togglePlay: () => void;
  isGuest: boolean;
  signInWithGoogle: () => void;
  handleSync: () => void;
  isOnline: boolean;
  isSyncing: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  triggerLogoSpin,
  isLogoSpinning,
  setIsNotificationOpen,
  unreadCount,
  isPlaying,
  togglePlay,
  isGuest,
  signInWithGoogle,
  handleSync,
  isOnline,
  isSyncing
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
       <div className="flex items-center gap-2 cursor-pointer select-none" onClick={triggerLogoSpin}>
         <EkagraLogo 
            className="w-8 h-8 rounded-xl shadow-lg text-white"
            style={{ animation: isLogoSpinning ? 'spin 0.7s ease-in-out' : 'none' }}
         />
         <h1 className="font-bold text-xl tracking-tight text-slate-100">EKAGRAZONE</h1>
       </div>
       <div className="flex items-center gap-2">
           {/* Notification Bell (Mobile) */}
           <button onClick={() => setIsNotificationOpen(true)} className="p-1.5 rounded-full bg-white/5 border border-white/5 relative">
               <Bell size={16} className="text-slate-400" />
               {unreadCount > 0 && <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />}
           </button>

           {/* Mobile Sound Indicator */}
           {isPlaying && (
               <button onClick={togglePlay} className="p-1.5 rounded-full bg-white/5 border border-white/5 text-emerald-400 animate-pulse">
                   <Volume2 size={14} />
               </button>
           )}
           {isGuest ? (
             <button 
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md bg-slate-800/50 border-white/10 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
             >
                 <LogIn size={12} />
                 <span className="hidden sm:inline">Sign In</span>
             </button>
           ) : (
             <button 
                onClick={handleSync}
                disabled={!isOnline || isSyncing}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-md transition-all ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}
            >
                {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span className="hidden sm:inline">{isSyncing ? 'Syncing' : isOnline ? 'Online' : 'Offline'}</span>
            </button>
           )}
       </div>
    </div>
  );
};
