
import React from 'react';
import { EkagraLogo } from '@/components/EkagraLogo';

export const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center z-50">
            <EkagraLogo className="w-16 h-16 animate-spin text-cyan-500" />
            <p className="mt-4 text-slate-400 font-mono text-sm animate-pulse">Initializing EkagraZone...</p>
        </div>
    );
};
