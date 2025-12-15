import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'right' | 'top' | 'bottom';
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'right', delay = 200 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div className="relative flex items-center" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      
      {isVisible && (
        <div 
          className={`
            absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-[#2C2C2E]/90 backdrop-blur-md 
            border border-white/10 rounded-lg shadow-xl whitespace-nowrap animate-fade-in pointer-events-none
            ${position === 'right' ? 'left-full ml-2' : ''}
            ${position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? 'top-full mt-2 left-1/2 -translate-x-1/2' : ''}
          `}
        >
          {content}
          {/* Arrow */}
          <div 
            className={`
              absolute w-2 h-2 bg-[#2C2C2E]/90 rotate-45
              ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
              ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;