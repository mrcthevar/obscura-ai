
import React, { useState, useEffect } from 'react';

interface TourStep {
  targetId?: string; // If null, center screen
  title: string;
  description: string;
  position: 'center' | 'right' | 'left' | 'bottom';
}

const STEPS: TourStep[] = [
  {
    targetId: undefined,
    title: "Welcome to OBSCURA",
    description: "Your personal Cinematic Intelligence Suite. This platform uses advanced AI to help you direct, shoot, and visualize your films.",
    position: 'center'
  },
  {
    targetId: 'sidebar-nav',
    title: "The Command Center",
    description: "Navigate between specialized AI agents here. From Lighting analysis (LUX) to Storyboarding.",
    position: 'right'
  },
  {
    targetId: 'modules-grid',
    title: "Select a Module",
    description: "Click any card to activate that tool. Hover over cards to see detailed capabilities.",
    position: 'center'
  },
  {
    targetId: 'project-status',
    title: "Project Management",
    description: "Connect your Google Drive here to automatically save your storyboards, scripts, and dossiers.",
    position: 'right'
  }
];

const TourGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('obscura_tour_completed');
    if (!hasSeenTour) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    const step = STEPS[currentStep];
    if (step.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        setRect(el.getBoundingClientRect());
      }
    } else {
      setRect(null);
    }
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const finishTour = () => {
    setIsOpen(false);
    localStorage.setItem('obscura_tour_completed', 'true');
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  const getPopoverStyle = () => {
    if (!rect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    if (step.position === 'right') {
      return {
        top: rect.top + (rect.height / 2) - 100,
        left: rect.right + 24,
      };
    }
    
    return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-500"></div>

      {rect && (
        <div 
          className="absolute border-2 border-[var(--accent)] rounded-[2rem] shadow-[0_0_100px_var(--shadow-glow)] transition-all duration-700 ease-in-out bg-transparent pointer-events-none"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}

      <div 
        className="absolute w-[360px] bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-[2.5rem] shadow-2xl p-10 transition-all duration-500 ease-out flex flex-col gap-6 animate-fade-in"
        style={getPopoverStyle()}
      >
        <div className="flex justify-between items-start">
            <h3 className="text-2xl font-cinzel text-[var(--text-primary)] leading-tight">{step.title}</h3>
            <span className="text-[10px] font-mono text-[var(--text-muted)] font-bold">{currentStep + 1} / {STEPS.length}</span>
        </div>
        
        <p className="text-sm text-[var(--text-secondary)] font-inter leading-relaxed font-light">
            {step.description}
        </p>

        <div className="flex justify-between items-center mt-4 pt-6 border-t border-[var(--border-subtle)]">
            <button 
                onClick={finishTour}
                className="text-[10px] font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-widest"
            >
                Skip
            </button>
            <button 
                onClick={handleNext}
                className="bg-[var(--accent)] text-black text-xs font-black px-6 py-3 rounded-2xl hover:bg-white transition-all shadow-xl active:scale-95 uppercase tracking-widest"
            >
                {currentStep === STEPS.length - 1 ? 'Finish' : 'Next →'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TourGuide;
