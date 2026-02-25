import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface HeaderAdProps {
    onClick?: () => void;
    isZenMode?: boolean;
}

export const HeaderAd: React.FC<HeaderAdProps> = ({ onClick, isZenMode = false }) => {
    const adRef = useRef<HTMLModElement>(null);

    useEffect(() => {
        // Delay to ensure layout is computed and width is > 0, especially with animations
        const timer = setTimeout(() => {
            if (adRef.current && adRef.current.innerHTML === "") {
                 // Check if visible/has width to prevent "No slot size for availableWidth=0"
                 if (adRef.current.offsetWidth === 0) {
                     // If width is 0, we can't load responsive ads. 
                     // This might happen if the component is hidden or not yet laid out.
                     return; 
                 }

                 try {
                    // @ts-ignore
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                 } catch (e: any) {
                     // Suppress specific known errors that are benign
                     if (e.message && (e.message.includes("All 'ins' elements") || e.message.includes("No slot size"))) {
                         return;
                     }
                     console.error("AdSense push error", e);
                 }
            }
        }, 500); // 500ms delay to let animations finish

        return () => clearTimeout(timer);
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
                     ref={adRef}
                     style={{ display: 'block', width: '100%', height: '100%' }}
                     data-ad-client="ca-pub-7115835596417882"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
            </div>
        </motion.div>
    );
};
