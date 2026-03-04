import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
    config: { type: 'today' | 'all'; title: string; message: string; } | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ config, onConfirm, onCancel }) => {
    const [inputValue, setInputValue] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    if (!config) return null;

    const isDangerMode = config.type === 'all';
    const isValid = isDangerMode ? inputValue === 'RESET' : true;

    const handleConfirm = () => {
        if (!isValid) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            return;
        }
        onConfirm();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
            `}</style>
            
            <div className={`bg-slate-900 border ${isDangerMode ? 'border-red-500/50' : 'border-white/10'} rounded-2xl p-6 max-w-sm w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-200`}>
                <div className={`flex items-center gap-3 mb-4 ${isDangerMode ? 'text-red-500' : 'text-slate-200'}`}>
                    <AlertTriangle size={32} className={isDangerMode ? 'animate-pulse' : ''} />
                    <h3 className="text-xl font-bold leading-tight">{config.title}</h3>
                </div>
                
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">{config.message}</p>
                
                {isDangerMode && (
                    <div className="mb-6">
                        <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2 block">
                            Type <span className="bg-red-500/10 px-1 rounded text-red-300">RESET</span> to confirm
                        </label>
                        <input 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="RESET"
                            className="w-full bg-red-950/20 border border-red-900/50 rounded-xl p-3 text-red-200 placeholder-red-900/50 focus:outline-none focus:border-red-500 transition-colors font-mono font-bold tracking-widest text-center"
                            autoFocus
                        />
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-colors border border-white/5">Cancel</button>
                    <button 
                        onClick={handleConfirm} 
                        className={`
                            flex-1 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2
                            ${isDangerMode 
                                ? isValid 
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20' 
                                    : 'bg-red-900/20 text-red-800 cursor-not-allowed border border-red-900/10 opacity-50'
                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20'
                            }
                            ${isShaking ? 'shake' : ''}
                        `}
                    >
                        <Trash2 size={18} /> {isDangerMode ? 'Delete Everything' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};
