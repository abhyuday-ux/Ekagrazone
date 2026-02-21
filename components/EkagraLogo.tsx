import React from 'react';

interface EkagraLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export const EkagraLogo: React.FC<EkagraLogoProps> = ({ className, style }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      style={style}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Square with Rounded Corners */}
      <rect width="100" height="100" rx="22" fill="currentColor" />
      
      {/* The 'E' shape constructed from a bolt and bars */}
      <g fill="white">
        {/* Vertical Bolt Spine */}
        <path d="M38 15 L 52 15 L 42 48 L 56 48 L 28 85 L 38 55 L 24 55 L 38 15 Z" />
        
        {/* Top Bar */}
        <path d="M54 18 H 82 L 78 28 H 50 Z" />
        
        {/* Middle Bar */}
        <path d="M48 45 H 72 L 68 55 H 44 Z" />
        
        {/* Bottom Bar */}
        <path d="M34 72 H 74 L 70 82 H 30 Z" />
      </g>
    </svg>
  );
};
