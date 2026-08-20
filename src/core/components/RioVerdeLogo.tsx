import React from 'react';

interface RioVerdeLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const RioVerdeLogo: React.FC<RioVerdeLogoProps> = ({ 
  className = '', 
  size = 'md',
  showSubtitle = true 
}) => {
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 40;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* 4 Quadrants Emblem (#008d50, #324f72, #f88543, #ead04d) */}
      <div 
        className="relative shrink-0 flex items-center justify-center p-1 rounded-xl bg-[#132030] border border-[#324f72]/60 shadow-xs"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top-Left Quadrant: #008d50 (Green) */}
          <path
            d="M10 24C10 16.268 16.268 10 24 10H46V46H10V24Z"
            fill="#008d50"
            rx="4"
          />
          {/* Top-Right Quadrant: #324f72 (Navy Blue) */}
          <path
            d="M54 10H76C83.732 10 90 16.268 90 24V46H54V10Z"
            fill="#324f72"
            rx="4"
          />
          {/* Bottom-Left Quadrant: #f88543 (Orange) */}
          <path
            d="M10 54H46V90H24C16.268 90 10 83.732 10 76V54Z"
            fill="#f88543"
            rx="4"
          />
          {/* Bottom-Right Quadrant: #ead04d (Yellow) */}
          <path
            d="M54 54H90V76C90 83.732 83.732 90 76 90H54V54Z"
            fill="#ead04d"
            rx="4"
          />
          {/* Central Star Emblem */}
          <circle cx="50" cy="50" r="16" fill="#324f72" stroke="#ffffff" strokeWidth="2.5" />
          <path
            d="M50 39L53.5 46.5L61.5 47.5L55.5 53L57 61L50 57L43 61L44.5 53L38.5 47.5L46.5 46.5L50 39Z"
            fill="#ead04d"
          />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5 leading-none">
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-slate-400">
            Prefeitura de
          </span>
        </div>
        <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
          RIO VERDE
          <span className="inline-block w-2 h-2 rounded-full bg-[#008d50]"></span>
        </span>
        {showSubtitle && (
          <span className="text-[9px] tracking-wider uppercase font-extrabold text-[#ead04d] -mt-0.5">
            O Trabalho Continua
          </span>
        )}
      </div>
    </div>
  );
};
