import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
    testTitle: string;
    onConfirm: () => void;
    onClose: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ testTitle, onConfirm, onClose }) => {
    const [inputValue, setInputValue] = useState('');
    const isMatch = inputValue === 'DELETE';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden shadow-rose-500/20"
            >
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-rose-500/10 to-transparent blur-3xl animate-pulse-slow" />
                
                <div className="relative z-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-rose-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
                    <p className="text-sm text-slate-400 mb-4">
                        You are about to delete <span className="font-bold text-rose-300">{testTitle}</span>.
                    </p>
                    <div className="bg-rose-900/20 border border-rose-500/20 rounded-xl p-3 text-xs text-rose-300/80 mb-6">
                        This action is permanent. All your attempt history and graphs for this test will be lost forever.
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">To confirm, type 'DELETE' below</p>
                        <input 
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-sm text-white text-center font-mono tracking-widest focus:border-rose-500/50 outline-none transition-all"
                        />
                        <button 
                            onClick={onConfirm}
                            disabled={!isMatch}
                            className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 
                                ${!isMatch 
                                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                                }
                            `}
                        >
                            <Trash2 size={16} />
                            Permanently Delete
                        </button>
                         <button 
                            onClick={onClose}
                            className="w-full py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
