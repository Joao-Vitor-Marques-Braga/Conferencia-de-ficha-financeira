import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`solid-card rounded-2xl p-5 border border-[#324f72]/40 transition-all ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#324f72]/30">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-base font-bold text-white">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
