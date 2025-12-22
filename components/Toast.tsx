
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'error', onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColors = {
    error: 'bg-red-500/10 border-red-500 text-red-500',
    success: 'bg-green-500/10 border-green-500 text-green-500',
    info: 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--accent)]'
  };

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform w-full max-w-lg px-6 pointer-events-none ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <div className={`backdrop-blur-xl border px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-start gap-4 ${bgColors[type]} pointer-events-auto`}>
        <div className="flex flex-col flex-1 min-w-0">
           <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-70">
             {type === 'error' ? 'System Exception' : type === 'success' ? 'Operation Complete' : 'System Notice'}
           </span>
           <span className="font-mono text-xs font-bold break-words leading-relaxed">{message}</span>
        </div>
        <button onClick={() => setIsVisible(false)} className="opacity-50 hover:opacity-100 transition-opacity p-1 shrink-0 mt-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
