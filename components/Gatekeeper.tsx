import React, { useState } from 'react';

interface GatekeeperProps {
  onSubmit: (key: string) => void;
}

const Gatekeeper: React.FC<GatekeeperProps> = ({ onSubmit }) => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputKey.startsWith('AIza')) {
      setError('Invalid Key Format. Must start with "AIza..."');
      return;
    }
    onSubmit(inputKey);
  };

  return (
    <div className="min-h-screen bg-black/95 flex items-center justify-center px-4 relative">
      
      <div className="max-w-md w-full bg-[#0A0A0A] border border-neutral-800 p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md relative z-10">
        <h2 className="text-3xl font-cinzel text-white mb-2 text-center">The Gatekeeper</h2>
        <p className="text-neutral-500 text-center font-inter text-sm mb-8">
          A Gemini API Key is required to power the intelligence modules.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError('');
              }}
              placeholder="Paste your API Key here..."
              className="w-full bg-[#050505] border border-neutral-700 text-white px-4 py-3 focus:outline-none focus:border-[#FFD700] transition-colors font-mono text-sm"
            />
            {error && <p className="text-red-500 text-xs mt-2 font-inter">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-[#FFD700] text-black font-bold py-3 hover:bg-white transition-colors duration-300 font-inter tracking-wide"
          >
            ACCESS TERMINAL
          </button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-neutral-600 hover:text-[#FFD700] underline decoration-neutral-800 underline-offset-4 transition-colors"
          >
            Generate a free key at Google AI Studio
          </a>
        </div>
      </div>
    </div>
  );
};

export default Gatekeeper;