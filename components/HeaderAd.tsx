import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface HeaderAdProps {
    onClick?: () => void;
    isZenMode?: boolean;
}

export const HeaderAd: React.FC<HeaderAdProps> = ({ onClick, isZenMode = false }) => {
    useEffect(() => {
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense error", e);
        }
    }, []);

    return (
        <motion.div 
            initial={{ y: -50, opacity: 0, x: isZenMode ? "-50%" : 0 }}
            animate={{ y: 0, opacity: 1, x: isZenMode ? "-50%" : 0 }}
            className={`
                ${isZenMode ? 'fixed top-[10px] left-1/2 w-[90%] max-w-lg z-[9999]' : 'w-full z-[50] flex-none relative'}
                flex justify-center items-center my-2
            `}
        >
            <div className="w-full max-w-[728px] min-h-[90px] bg-slate-900/40 backdrop-blur-sm border border-white/5 rounded-lg overflow-hidden flex items-center justify-center">
                {/* Google AdSense Unit */}
                <ins className="adsbygoogle"
                     style={{ display: 'block', width: '100%', height: '100%' }}
                     data-ad-client="ca-pub-7115835596417882"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            </div>
        </motion.div>
    );
};
