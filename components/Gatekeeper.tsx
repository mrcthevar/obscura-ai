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
      setError('Invalid format. Key must start with "AIza"');
      return;
    }
    onSubmit(inputKey);
  };

  return (
    <div className="min-h-screen bg-[#161618] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#2C2C2E] rounded-xl mx-auto flex items-center justify-center mb-4 text-[#FFD700]">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 11.235a2 2 0 10-.708.708l3.475 3.475A6 6 0 1019 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-white">Authentication Required</h2>
          <p className="text-[#8E8E93] text-sm mt-2">Enter your Gemini API Key to access the suite.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setError('');
              }}
              placeholder="AIza..."
              className="w-full bg-[#1C1C1E] border border-white/10 text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all placeholder-[#48484A]"
              autoFocus
            />
            {error && <p className="text-red-400 text-xs mt-2 ml-1">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={!inputKey}
            className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-[#F2F2F7] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Connect
          </button>
        </form>

        <div className="mt-8 text-center">
          <a 
            href="https://aistudio.google.com/app/apikey" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-[#636366] hover:text-[#AEAEB2] transition-colors"
          >
            Get a key from Google AI Studio &rarr;
          </a>
        </div>
      </div>
    </div>
  );
};

export default Gatekeeper;