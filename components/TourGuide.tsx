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
      // Small delay to ensure UI renders first
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

  // Calculate position style for the popup box
  const getPopoverStyle = () => {
    if (!rect || step.position === 'center') {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    // Simple positioning logic
    if (step.position === 'right') {
      return {
        top: rect.top + (rect.height / 2) - 100, // Vertically center-ish
        left: rect.right + 20,
      };
    }
    
    // Fallback or other positions can be added here
    return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop with "Hole" logic or simple dimming */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-500"></div>

      {/* Spotlight highlight (Optional visual flare) */}
      {rect && (
        <div 
          className="absolute border-2 border-[#FFD700] rounded-xl shadow-[0_0_100px_rgba(255,215,0,0.2)] transition-all duration-500 ease-in-out bg-transparent pointer-events-none"
          style={{
            top: rect.top - 5,
            left: rect.left - 5,
            width: rect.width + 10,
            height: rect.height + 10,
          }}
        />
      )}

      {/* Content Card */}
      <div 
        className="absolute w-[320px] bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl p-6 transition-all duration-500 ease-out flex flex-col gap-4 animate-fade-in"
        style={getPopoverStyle()}
      >
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-cinzel text-white">{step.title}</h3>
            <span className="text-[10px] font-mono text-[#636366]">{currentStep + 1} / {STEPS.length}</span>
        </div>
        
        <p className="text-sm text-[#AEAEB2] font-inter leading-relaxed">
            {step.description}
        </p>

        <div className="flex justify-between items-center mt-2 pt-4 border-t border-white/5">
            <button 
                onClick={finishTour}
                className="text-xs text-[#636366] hover:text-white transition-colors"
            >
                Skip Tour
            </button>
            <button 
                onClick={handleNext}
                className="bg-white text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#FFD700] transition-colors"
            >
                {currentStep === STEPS.length - 1 ? 'Finish' : 'Next →'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TourGuide;