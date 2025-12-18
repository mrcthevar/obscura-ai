
import React, { useState, useEffect } from 'react';

interface GatekeeperProps {
  onSuccess: (key?: string) => void;
}

const Gatekeeper: React.FC<GatekeeperProps> = ({ onSuccess }) => {
  const [manualKey, setManualKey] = useState('');
  const [status, setStatus] = useState<{
    envKey: boolean;
    sdkReady: boolean;
  }>({ envKey: false, sdkReady: false });

  useEffect(() => {
    const checkSystems = () => {
      // Check for key in environment or existing localStorage
      const api_key = (window as any).process?.env?.API_KEY;
      const hasKey = !!api_key && api_key.length > 5;
      const hasSdk = !!(window as any).aistudio;
      
      setStatus({
        envKey: hasKey,
        sdkReady: hasSdk
      });
      
      // If a key is already present, auto-advance
      if (hasKey) {
        onSuccess(api_key);
      }
    };
    checkSystems();
  }, [onSuccess]);

  const handleManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = manualKey.trim();
    if (cleanKey.length < 10) {
      alert("Please enter a valid Gemini API Key.");
      return;
    }

    // Save to localStorage for persistence
    localStorage.setItem('obscura_api_key', cleanKey);
    
    // Inject into the global process object immediately
    if (!(window as any).process) (window as any).process = { env: {} };
    if (!(window as any).process.env) (window as any).process.env = {};
    (window as any).process.env.API_KEY = cleanKey;

    onSuccess(cleanKey);
  };

  const handleLinkSelection = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      try {
        await aistudio.openSelectKey();
        // The key is injected by the platform into process.env.API_KEY
        // We call onSuccess to move to the dashboard
        onSuccess();
      } catch (e) {
        console.error("Link failed", e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      <div className="film-grain"></div>
      <div className="cinematic-vignette"></div>
      
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)]/[0.05] blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-lg z-50 flex flex-col items-center animate-fade-in">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-white/[0.02] mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_#F59E0B]"></div>
            <span className="text-[9px] font-black font-mono text-zinc-400 uppercase tracking-[0.3em]">System Initialization Protocol</span>
          </div>
          <h2 className="text-5xl font-brand tracking-tighter mb-4">Neural Gate</h2>
          <p className="text-zinc-500 font-light text-sm max-w-xs mx-auto leading-relaxed">
            Unlock the studio by pasting your API key. No coding or complex setup required.
          </p>
        </div>

        <form onSubmit={handleManualEntry} className="w-full space-y-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl blur opacity-30 group-focus-within:opacity-100 transition duration-1000"></div>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-amber-500 font-mono text-sm opacity-50">&gt;</span>
              <input 
                type="password"
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                placeholder="Paste API Key here..."
                className="w-full bg-black border border-white/10 rounded-3xl py-6 pl-12 pr-6 text-sm font-mono tracking-widest outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-800"
                autoFocus
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:bg-[var(--accent)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-500 active:scale-95"
          >
            Authorize System
          </button>
        </form>

        <div className="mt-12 w-full space-y-4">
           {status.sdkReady && (
             <button 
               onClick={handleLinkSelection}
               className="w-full py-4 border border-white/5 bg-white/[0.01] rounded-2xl text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] hover:bg-white/5 transition-all"
             >
               Use Neural Link (AI Studio)
             </button>
           )}
           
           <div className="p-8 border border-white/5 bg-white/[0.01] rounded-[2.5rem] text-center">
             <h4 className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-3 font-mono">Simple Setup</h4>
             <p className="text-[10px] text-zinc-600 leading-relaxed font-mono">
               Need a key? Visit <a href="https://aistudio.google.com/" target="_blank" className="text-amber-500/50 hover:text-amber-500 underline font-bold">Google AI Studio</a> to get one for free. 
               <br/><br/>
               Paste it above and you're ready to create.
             </p>
           </div>
        </div>
      </div>

      <div className="absolute bottom-12 text-[9px] font-mono text-zinc-900 tracking-[0.5em] uppercase pointer-events-none">
        Obscura OS // Synthesis Engine v1.0.6
      </div>
    </div>
  );
};

export default Gatekeeper;
