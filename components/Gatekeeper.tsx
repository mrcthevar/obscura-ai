
import React, { useState, useEffect } from 'react';

interface GatekeeperProps {
  onSuccess: () => void;
}

const Gatekeeper: React.FC<GatekeeperProps> = ({ onSuccess }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [status, setStatus] = useState<{
    envKey: boolean;
    driveAuth: boolean;
    googleAuth: boolean;
  }>({ envKey: false, driveAuth: false, googleAuth: false });

  useEffect(() => {
    const checkSystems = async () => {
      const hasEnvKey = !!process.env.API_KEY && process.env.API_KEY !== '';
      const hasDriveId = !!(import.meta.env?.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('obscura_client_id'));
      
      setStatus({
        envKey: hasEnvKey,
        driveAuth: hasDriveId,
        googleAuth: !!window.google?.accounts?.id
      });
      
      // If we have an environment key, we can proceed automatically to the dashboard
      // However, we stay here for a moment for cinematic effect/feedback
      setTimeout(() => setIsChecking(false), 1500);
    };
    checkSystems();
  }, []);

  const handleConnectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions to avoid race conditions
      onSuccess();
    } catch (e) {
      console.error("Key selection failed", e);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-12 text-white overflow-hidden">
      <div className="film-grain"></div>
      <div className="cinematic-vignette"></div>

      <div className="w-full max-w-xl z-50 animate-fade-in">
        <div className="mb-16 text-center">
          <div className="inline-block px-4 py-1.5 rounded-full border border-[var(--accent)]/30 text-[9px] font-black font-mono text-[var(--accent)] uppercase tracking-[0.4em] mb-8 animate-pulse">
            System Initialization
          </div>
          <h2 className="text-4xl font-brand tracking-tighter mb-4">Uplink Protocols</h2>
          <p className="text-zinc-500 font-light text-sm max-w-xs mx-auto leading-relaxed">
            Verify system integrity and establish neural connection to initialize the studio environment.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-8 backdrop-blur-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${status.envKey ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-amber-500 shadow-[0_0_10px_#f59e0b]'}`}></div>
                <span className="text-[10px] font-black font-mono uppercase tracking-widest text-zinc-400">Environment Key</span>
              </div>
              <span className={`text-[9px] font-mono ${status.envKey ? 'text-green-500' : 'text-amber-500 italic'}`}>
                {status.envKey ? 'CONFIGURED' : 'PENDING_SELECTION'}
              </span>
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${status.googleAuth ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                <span className="text-[10px] font-black font-mono uppercase tracking-widest text-zinc-400">Google Services</span>
              </div>
              <span className={`text-[9px] font-mono ${status.googleAuth ? 'text-green-500' : 'text-red-500'}`}>
                {status.googleAuth ? 'ESTABLISHED' : 'BLOCKED_BY_ORIGIN'}
              </span>
            </div>
          </div>

          <div className="pt-4">
            <button 
              onClick={status.envKey ? onSuccess : handleConnectKey}
              className="w-full py-5 bg-[var(--accent)] text-black rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-white transition-all shadow-2xl active:scale-95"
            >
              {status.envKey ? 'Enter Studio' : 'Select Neural Key'}
            </button>
            <p className="text-center mt-6 text-[9px] text-zinc-600 font-mono tracking-tighter max-w-[280px] mx-auto">
              {status.googleAuth 
                ? "Systems Ready. Key selection will be encrypted at the browser level."
                : "AUTH_ERROR: origin_mismatch. Please add this URL to your Google Cloud JavaScript Origins."}
            </p>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <button onClick={onSuccess} className="text-zinc-600 hover:text-white transition-colors text-[9px] font-black uppercase tracking-[0.3em] border-b border-zinc-800 pb-1">Bypass to Terminal</button>
        </div>
      </div>
    </div>
  );
};

export default Gatekeeper;
