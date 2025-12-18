
import React, { useEffect, useRef } from 'react';

const FlashlightCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: -1000, y: -1000 }); // Start off-screen

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      positionRef.current = { x: e.clientX, y: e.clientY };
    };

    const updatePosition = () => {
      if (cursorRef.current) {
        const { x, y } = positionRef.current;
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#F59E0B';
        // Very low opacity to ensure it's just a subtle background atmospheric effect
        cursorRef.current.style.background = `radial-gradient(800px circle at ${x}px ${y}px, ${accentColor}05, transparent 50%)`;
      }
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove);
    const animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-300 bg-transparent"
    />
  );
};

export default FlashlightCursor;
