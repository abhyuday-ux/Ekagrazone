import React from 'react';
import { ShieldAlert, Lock } from 'lucide-react';

export const MaintenanceMode = () => (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <ShieldAlert size={40} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
            <p className="text-slate-400 mb-6">
                EkagraZone is currently in private beta. Your account is not authorized to access this deployment.
            </p>
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-center gap-3 text-left">
                <Lock size={20} className="text-slate-500 flex-shrink-0" />
                <div>
                    <div className="text-xs font-bold text-slate-500 uppercase">Status</div>
                    <div className="text-sm font-medium text-slate-300">Invite Only / Maintenance</div>
                </div>
            </div>
            <div className="mt-8 text-xs text-slate-600 font-mono">
                Error Code: 403_FORBIDDEN_BETA
            </div>
        </div>
    </div>
);
