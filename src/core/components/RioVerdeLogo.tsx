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
        className="relative shrink-0 flex items-center justify-center p-1 rounded-xl bg-slate-100 dark:bg-[#132030] border border-slate-200 dark:border-[#324f72]/60 shadow-xs transition-colors"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Document Sheet (Ficha Financeira) */}
          <path d="M12 16 C12 10.5 16.5 6 22 6 H60 L86 32 V84 C86 89.5 81.5 94 76 94 H22 C16.5 94 12 89.5 12 84 Z" fill="#0f1b29" stroke="#3a699b" strokeWidth="5" strokeLinejoin="round" />
          <path d="M60 6 V26 C60 29.3 62.7 32 66 32 H86 Z" fill="#1b2e44" stroke="#3a699b" strokeWidth="4.5" strokeLinejoin="round" />

          {/* Header Accent Pill (Green) */}
          <rect x="22" y="18" width="30" height="8" rx="4" fill="#00c865" />

          {/* 3 Progression Salary Bars */}
          <rect x="22" y="63" width="13" height="20" rx="6" fill="#46688e" />
          <rect x="40" y="49" width="13" height="34" rx="6" fill="#f3ca4e" />
          <rect x="58" y="35" width="13" height="35" rx="6" fill="#00c865" />

          {/* Audit Verification Seal */}
          <circle cx="74" cy="74" r="23" fill="#070d17" />
          <circle cx="74" cy="74" r="19" fill="#00a85a" />
          <path d="M65 74.5 L71.5 81 L83 67" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center space-x-1.5 leading-none">
          <span className="text-[10px] tracking-[0.2em] uppercase font-bold text-slate-500 dark:text-slate-400">
            Prefeitura de
          </span>
        </div>
        <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1 transition-colors">
          RIO VERDE
          <span className="inline-block w-2 h-2 rounded-full bg-[#008d50]"></span>
        </span>
        {showSubtitle && (
          <span className="text-[9px] tracking-wider uppercase font-black text-amber-700 dark:text-[#ead04d] -mt-0.5">
            O Trabalho Continua
          </span>
        )}
      </div>
    </div>
  );
};
