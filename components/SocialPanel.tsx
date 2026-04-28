
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Friend, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, UserPlus, X, Check, Activity, Crown, Zap, Globe, Loader2, AlertCircle, LogIn, Clock } from 'lucide-react';
import { rtdb } from '../services/firebase';
import { ref, onValue, off, query } from 'firebase/database';

const formatDuration = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
};

const FriendRow: React.FC<{ 
    profile: UserProfile; 
    isMe: boolean;
    onClick: () => void;
    showStatus?: boolean;
    subtitle?: string; 
}> = ({ profile, isMe, onClick, showStatus = true, subtitle }) => {
    const [status, setStatus] = useState<{ isOnline: boolean; isFocusing: boolean }>({ isOnline: false, isFocusing: false });

    useEffect(() => {
        if (!showStatus || profile.uid.startsWith('mock-')) return;
        const statusRef = ref(rtdb, `users/${profile.uid}/publicStatus`);
        const handleUpdate = (snapshot: any) => {
            const val = snapshot.val();
            if (val) {
                setStatus({
                    isOnline: val.isOnline || false,
                    isFocusing: val.isFocusing || false
                });
            } else {
                setStatus({ isOnline: false, isFocusing: false });
            }
        };
        onValue(statusRef, handleUpdate);
        return () => off(statusRef);
    }, [profile.uid, showStatus]);

    return (
        <motion.div 
            layout 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className={`
                flex items-center justify-between px-4 py-3 rounded-2xl cursor-pointer
                transition-all group relative border
                ${isMe 
                    ? 'bg-gradient-to-r from-indigo-500/10 to-indigo-500/5 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/5 hover:border-white/10'}
            `}
        >
            <div className="flex items-center gap-4 min-w-0 flex-1 pl-4">
                <div className="relative flex-none">
                    {/* Live Presence Dots */}
                    <div className="absolute -top-1 -right-1 z-20">
                        {status.isFocusing ? (
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                            </span>
                        ) : status.isOnline ? (
                            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] border border-slate-900"></span>
                        ) : null}
                    </div>

                    {profile.photoURL ? (
                        <img src={profile.photoURL} className={`w-10 h-10 rounded-full object-cover bg-slate-800 relative z-10 border-2 ${status.isFocusing ? 'border-cyan-500/50' : 'border-transparent'}`} alt={profile.displayName} />
                    ) : (
                        <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 relative z-10 border-2 ${status.isFocusing ? 'border-cyan-500/50' : 'border-transparent'}`}>
                            {profile.displayName?.[0]}
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-sm truncate ${isMe ? 'text-white' : 'text-slate-300'}`}>
                            {profile.displayName || 'Unknown'}
                        </h4>
                        {isMe && <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-medium border border-indigo-500/20">YOU</span>}
                        {profile.subscriptionType === 'yearly' && (
                            <span className="hidden sm:flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold border border-amber-500/20 whitespace-nowrap">
                                <Crown size={10} fill="currentColor" /> FOUNDING MEMBER
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {subtitle && <span className="text-[10px] text-slate-500">{subtitle}</span>}
                    </div>
                </div>
            </div>

            <div className="text-right flex-none pl-3">
                <div className={`text-sm font-mono font-bold ${status.isFocusing ? 'text-cyan-400' : 'text-slate-300'}`}>
                    {formatDuration(profile.totalFocusMs || 0)} <span className="text-[10px] text-slate-500 font-sans">Focus</span>
                </div>
                {status.isFocusing && (
                    <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider animate-pulse flex items-center justify-end gap-1">
                        Focusing <Zap size={8} fill="currentColor" />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export const SocialPanel: React.FC = () => {
    const { currentUser, isGuest, hasPremium, signInWithGoogle, logout } = useAuth();
    const { accent } = useTheme();
    // Data States
    const [friends, setFriends] = useState<Friend[]>([]);
    
    // Add Friend UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<UserProfile | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [searchError, setSearchError] = useState('');

    // Detail View
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

    // Load My Profile
    useEffect(() => {
        if (isGuest) return;
        const loadMyProfile = async () => {
            const profile = await dbService.getUserProfile();
            setCurrentUserProfile(profile);
        };
        loadMyProfile();
    }, [isGuest]);

    // Firestore Friends Subscription
    useEffect(() => {
        if (isGuest) return;

        const unsubFriends = dbService.subscribeToFriends((friendList) => {
            setFriends(friendList);
        });

        return () => {
            if (unsubFriends) unsubFriends();
        };
    }, [isGuest]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setSearchLoading(true);
        setSearchResult(null);
        setSearchError('');
        setRequestSent(false);

        try {
            const user = await dbService.findUserByUsername(searchQuery.trim());
            if (user && user.uid !== currentUser?.uid) {
                setSearchResult(user);
            } else if (user?.uid === currentUser?.uid) {
                setSearchError("That's you!");
            } else {
                setSearchError("User not found.");
            }
        } catch (e) {
            console.error(e);
            setSearchError("Error searching.");
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddFriend = async () => {
        if (!searchResult) return;
        await dbService.sendFriendRequest(searchResult.uid);
        setRequestSent(true);
    };

    const handleAcceptFriend = async (uid: string) => {
        await dbService.acceptFriendRequest(uid);
    };

    // Filter Accepted Friends
    const acceptedFriends = friends.filter(f => f.status === 'accepted' && f.profile);
    const pendingRequests = friends.filter(f => f.status === 'pending_received' && f.profile);

    // Sort Friends by Focus Time descending
    const sortedFriends = [...acceptedFriends].sort((a, b) => (b.profile?.totalFocusMs || 0) - (a.profile?.totalFocusMs || 0));

    return (
        <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-3xl overflow-hidden relative border border-white/5">
            
            {/* Main Header */}
            <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 flex-none">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        Friends
                    </h2>
                    <p className="text-sm text-slate-400">Connect with others.</p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                
                {/* Guest Lock Overlay */}
                {isGuest && (
                    <div className="absolute inset-0 z-40 backdrop-blur-md bg-slate-900/60 flex flex-col items-center justify-center text-center p-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
                            <Users size={32} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Connect with Friends</h3>
                        <p className="text-slate-400 max-w-xs mx-auto mb-8">
                            Sign in to compete with friends.
                        </p>
                        <button 
                            onClick={() => logout()}
                            className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                        >
                            <LogIn size={18} />
                            Sign In to Compete
                        </button>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    
                    {/* User Detail Overlay */}
                    {selectedUser && (
                        <motion.div 
                            key="detail"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl p-8 flex flex-col items-center justify-center"
                        >
                            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            
                            <div className="w-full max-w-md bg-slate-800/50 border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden">
                                <div className={`absolute top-0 inset-x-0 h-1 bg-${accent}-500 opacity-50`} />
                                
                                <div className="w-24 h-24 mx-auto rounded-full bg-slate-700 p-1 border-4 border-slate-600 shadow-xl mb-4 relative">
                                    {selectedUser.photoURL ? (
                                        <img src={selectedUser.photoURL} className="w-full h-full rounded-full object-cover" alt={selectedUser.displayName} />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-slate-600 flex items-center justify-center text-2xl font-bold text-slate-300">
                                            {selectedUser.displayName?.[0]}
                                        </div>
                                    )}
                                    {selectedUser.subscriptionType === 'yearly' && (
                                        <div className="absolute -bottom-2 -right-2 bg-slate-900 text-amber-400 border border-slate-700 p-1.5 rounded-full">
                                            <Crown size={16} fill="currentColor" />
                                        </div>
                                    )}
                                </div>
                                
                                <h3 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                                    {selectedUser.displayName}
                                    {selectedUser.subscriptionType === 'yearly' && <Crown size={16} className="text-amber-400" fill="currentColor" />}
                                </h3>
                                <p className="text-slate-400 text-sm font-mono mb-6">@{selectedUser.username || 'user'}</p>
                                
                                <div className="grid grid-cols-1 gap-4 text-left">
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Time</p>
                                        <p className="text-xl font-mono font-bold text-blue-400">{formatDuration(selectedUser.totalFocusMs || 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {!isGuest && (
                        <motion.div 
                            key="friends"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full overflow-y-auto px-6 pb-6 custom-scrollbar"
                        >
                            <div className="max-w-3xl mx-auto space-y-8 pt-4">
                                
                                {/* Search Section */}
                                <div className="bg-slate-800/30 p-4 rounded-2xl border border-white/5">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <UserPlus size={14} /> Add Friend
                                    </h3>
                                    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                            <input 
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Enter username (e.g. zen_master)"
                                                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={searchLoading || !searchQuery.trim()}
                                            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-300 font-bold text-sm transition-colors border border-white/5"
                                        >
                                            {searchLoading ? <Loader2 className="animate-spin" size={18} /> : 'Search'}
                                        </button>
                                    </form>

                                    {searchError && (
                                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-xl">
                                            <AlertCircle size={16} /> {searchError}
                                        </div>
                                    )}

                                    {searchResult && (
                                        <div className="flex items-center justify-between bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                                                    {searchResult.displayName?.[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm">{searchResult.displayName}</div>
                                                </div>
                                            </div>
                                            {requestSent ? (
                                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                                                    <Check size={14} /> Sent
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={handleAddFriend}
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                                                >
                                                    Add
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Requests Section */}
                                {pendingRequests.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Requests</h3>
                                        <div className="space-y-2">
                                            {pendingRequests.map(req => (
                                                <div key={req.uid} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                                                            {req.profile?.displayName?.[0]}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-200">{req.profile?.displayName}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleAcceptFriend(req.uid)}
                                                        className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                                                    >
                                                        <Check size={14} /> Accept
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Friends List Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                                        <span>Your Friends</span>
                                        <span className="bg-white/5 px-2 py-0.5 rounded-full">{acceptedFriends.length}</span>
                                    </h3>
                                    
                                    {sortedFriends.length === 0 ? (
                                        <div className="text-center py-12 text-slate-500 text-sm border-2 border-dashed border-white/5 rounded-2xl">
                                            No friends yet. Add someone above!
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {sortedFriends.map((friend, i) => (
                                                <FriendRow 
                                                    key={friend.uid}
                                                    profile={friend.profile!}
                                                    rank={i + 1}
                                                    isMe={false}
                                                    onClick={() => setSelectedUser(friend.profile!)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
