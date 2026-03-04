import React, { useEffect, useRef, useState } from 'react';

export const ContainerScroll = ({
  titleComponent,
  children,
}) => {
  const [rotateX, setRotateX] = useState(-15);
  const [scale, setScale] = useState(0.9);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate progress based on how far the element is from the bottom of the viewport
      // Start animating when the top of the element enters the viewport
      // Finish animating when the element is near the center
      const elementTop = rect.top;
      const triggerPoint = windowHeight;
      const endPoint = windowHeight * 0.2; // Finish when 20% from top
      
      let progress = (triggerPoint - elementTop) / (triggerPoint - endPoint);
      progress = Math.max(0, Math.min(1, progress)); // Clamp between 0 and 1
      
      setRotateX(-15 + progress * 15);
      setScale(0.9 + progress * 0.1);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex items-center justify-center relative p-4 md:p-10 w-full" style={{ perspective: '1000px' }}>
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
        <div className="w-full flex flex-col items-center justify-center mb-8 md:mb-16">
          {titleComponent}
        </div>
        
        <div
          ref={containerRef}
          className="w-full bg-slate-900/50 backdrop-blur-md rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `rotateX(${rotateX}deg) scale(${scale})`,
            transformOrigin: 'top center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
