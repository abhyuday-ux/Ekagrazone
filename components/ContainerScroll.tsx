import React, { useState, useEffect, useRef } from 'react';

export const ContainerScroll: React.FC = () => {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [scrollY, setScrollY] = useState(0);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        const handleScroll = () => {
            const currentScroll = window.scrollY;
            const transitionLimit = 600; // Pixel threshold for the full rotation effect
            
            // Calculate progress (0 to 1) for the rotation/scale
            const progress = Math.min(currentScroll / transitionLimit, 1);
            
            if (requestRef.current) return;

            requestRef.current = requestAnimationFrame(() => {
                setScrollProgress(progress);
                setScrollY(currentScroll);
                requestRef.current = null;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // 3D Transforms Logic
    // Rotate: Starts at 20deg, flattens to 0deg
    const rotateX = 20 - (scrollProgress * 20);
    
    // Scale: Starts slightly larger (1.1) and settles to 1.0
    const scale = 1.1 - (scrollProgress * 0.1);

    // Parallax Logic
    // Text moves up faster than the container to create the "behind" effect
    const textTranslateY = -scrollY * 0.85; 
    
    // Container moves up slightly or stays relatively pinned to create depth
    // We keep it mostly stable but allow slight movement
    const containerTranslateY = -scrollY * 0.1;

    return (
        <div className="w-full relative z-10 flex flex-col items-center justify-center pt-32 pb-10 overflow-hidden perspective-1000">
            
            {/* Kinetic Text Header */}
            {/* z-0 ensures it goes behind the container (z-20) when they overlap */}
            <div 
                className="relative z-0 text-center flex flex-col items-center justify-center mb-[-50px] md:mb-[-90px] will-change-transform"
                style={{ 
                    transform: `translateY(${textTranslateY}px)`,
                }}
            >
                {/* Layer 1: The Eyebrow */}
                <h2 className="font-mono text-violet-400 text-sm md:text-base tracking-[0.25em] mb-4 uppercase font-bold drop-shadow-lg">
                    The Science of Focus
                </h2>

                {/* Layer 2: The Headline */}
                <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-500 drop-shadow-2xl leading-[0.9]">
                    UNLEASH<br />YOUR PEAK
                </h1>
            </div>

            {/* 3D Container */}
            <div 
                className="relative w-full max-w-6xl mx-auto px-4 md:px-8 z-20"
                style={{ 
                    perspective: '1200px',
                    transform: `translateY(${containerTranslateY}px)`
                }}
            >
                <div 
                    className="w-full rounded-[30px] border border-white/10 bg-[#0f172a] p-2 md:p-4 shadow-2xl will-change-transform"
                    style={{
                        transform: `rotateX(${rotateX}deg) scale(${scale})`,
                        transformStyle: 'preserve-3d',
                        boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.7)' // Deep shadow
                    }}
                >
                    <div className="h-[300px] md:h-[700px] w-full overflow-hidden rounded-[24px] bg-slate-950 relative border border-white/5 shadow-inner group">
                        <img 
                            src="https://i.ibb.co/vvq9GkpG/image.png" 
                            alt="Deep Work Dashboard"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Reflection/Sheen effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none mix-blend-overlay" />
                        
                        {/* Inner Shadow for depth */}
                        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] pointer-events-none rounded-[24px]" />
                    </div>
                </div>
            </div>
        </div>
    );
};
