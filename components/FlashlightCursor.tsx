import React, { useEffect, useRef } from 'react';

const FlashlightCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Update ref immediately without triggering re-render
      positionRef.current = { x: e.clientX, y: e.clientY };
    };

    const updatePosition = () => {
      if (cursorRef.current) {
        const { x, y } = positionRef.current;
        // Use var(--accent) for the glow effect
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
        cursorRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, ${accentColor}08, transparent 40%)`;
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
      className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-300"
    />
  );
};

export default FlashlightCursor;