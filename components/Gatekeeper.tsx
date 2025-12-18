
import React, { useState, useEffect } from 'react';

interface GatekeeperProps {
  onSuccess: () => void;
}

const Gatekeeper: React.FC<GatekeeperProps> = ({ onSuccess }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [status, setStatus] = useState<{
    envKey: boolean;
    googleAuth: boolean;
    sdkReady: boolean;
  }>({ envKey: false, googleAuth: false, sdkReady: false });

  useEffect(() => {
    const checkSystems = async () => {
      // Check if process.env.API_KEY is actually populated
      const hasEnvKey = !!process.env.API_KEY && process.env.API_KEY.length > 5;
      const hasAistudio = !!window.aistudio;
      
      setStatus({
        envKey: hasEnvKey,
        googleAuth: !!window.google?.accounts?.id,
        sdkReady: hasAistudio
      });
      
      // If we have a hardcoded environment key, we can proceed automatically
      if (hasEnvKey) {
        setTimeout(() => onSuccess(), 1000);
      } else {
        setIsChecking(false);
      }
    };
    checkSystems();
  }, [onSuccess]);

  const handleConnectKey = async () => {
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Proceed immediately to satisfy the race condition rule
        onSuccess();
      } else {
        alert("Neural Uplink (AI Studio) is not available in this environment.");
      }
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  if (isChecking && status.envKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-2 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin"></div>
          <span className="text-[10px] font-mono text-[var(--accent)] uppercase tracking-[0.5em] animate-pulse">Initializing Neural Link...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-12 text-white overflow-hidden relative">
      <div className="film-grain"></div>
      <div className="cinematic-vignette"></div>

      <div className="w-full max-w-xl z-50 animate-fade-in">
        <div className="mb-16 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--accent)]/30 text-[9px] font-black font-mono text-[var(--accent)] uppercase tracking-[0.4em] mb-8 animate-pulse">
            System Authorization Required
          </div>
          <h2 className="text-4xl font-brand tracking-tighter mb-4">Neural Gatekeeper</h2>
          <p className="text-zinc-500 font-light text-sm max-w-xs mx-auto leading-relaxed">
            OBSCURA requires a valid Gemini API key to operate the cinematic intelligence modules.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-8 backdrop-blur-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${status.envKey ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`}></div>
                <span className="text-[10px] font-black font-mono uppercase tracking-widest text-zinc-400">Environment API Key</span>
              </div>
              <span className={`text-[9px] font-mono ${status.envKey ? 'text-green-500' : 'text-amber-500 italic'}`}>
                {status.envKey ? 'CONNECTED' : 'NOT_FOUND'}
              </span>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${status.sdkReady ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                <span className="text-[10px] font-black font-mono uppercase tracking-widest text-zinc-400">AI Studio Plugin</span>
              </div>
              <span className={`text-[9px] font-mono ${status.sdkReady ? 'text-green-500' : 'text-red-500'}`}>
                {status.sdkReady ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={handleConnectKey}
              className="w-full py-5 bg-[var(--accent)] text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white transition-all shadow-2xl active:scale-95"
            >
              Select API Key
            </button>
            <p className="text-center mt-6 text-[9px] text-zinc-600 font-mono tracking-tighter leading-relaxed">
              Selection via AI Studio ensures your key is handled securely by the platform. 
              <br/>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[var(--accent)] underline mt-2 inline-block">Billing Documentation</a>
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4">
          <p className="text-[9px] text-zinc-700 font-mono uppercase tracking-widest">Diagnostic Log</p>
          {!status.googleAuth && (
            <div className="text-[8px] text-amber-500/70 font-mono max-w-sm text-center leading-loose border border-amber-500/20 p-4 rounded-xl">
              WARNING: origin_mismatch detected. Google Login is unavailable. 
              Please add your deployment URL to "Authorized JavaScript origins" in Google Cloud Console.
            </div>
          )}
          <button onClick={onSuccess} className="text-zinc-600 hover:text-white transition-colors text-[9px] font-black uppercase tracking-[0.3em] border-b border-zinc-800 pb-1 mt-4">
            Bypass to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Gatekeeper;
