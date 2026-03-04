import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirm', 
    cancelText = 'Cancel' 
}) => {
    const { accent } = useTheme();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
          >
            <div className="flex items-start gap-4">
                <div className={`flex-none w-10 h-10 rounded-full flex items-center justify-center bg-yellow-500/10 text-yellow-400 border border-yellow-500/20`}>
                    <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                    <p className="text-sm text-slate-400 mb-6">{message}</p>
                </div>
                 <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-500 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>
            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                {cancelText}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-${accent}-600 hover:bg-${accent}-500 shadow-lg shadow-${accent}-500/20 border border-${accent}-400/20 transition-all`}
              >
                {confirmText}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
