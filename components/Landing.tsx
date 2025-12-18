
import React, { useEffect, useState, useCallback } from 'react';
import { UserProfile } from '../types';

interface LandingProps {
  onSignIn: (user: UserProfile) => void;
}

const Landing: React.FC<LandingProps> = ({ onSignIn }) => {
  const [activeClientId] = useState<string>(() => {
     const win = window as any;
     return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
            win.process?.env?.VITE_GOOGLE_CLIENT_ID || '';
  });

  const [isInitializing, setIsInitializing] = useState(true);

  const decodeJwt = (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleCredentialResponse = useCallback((response: any) => {
    if (response.credential) {
      const payload = decodeJwt(response.credential);
      if (payload) {
        onSignIn({
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          isGuest: false
        });
      }
    }
  }, [onSignIn]);

  const handleGuestLogin = () => {
    onSignIn({
      name: "Guest Operator",
      email: null,
      picture: "", 
      isGuest: true
    });
  };

  useEffect(() => {
    if (!activeClientId) {
      setIsInitializing(false);
      return;
    }
    
    let isMounted = true;
    const initGSI = () => {
      const google = (window as any).google;
      if (google?.accounts?.id && isMounted) {
        try {
          google.accounts.id.initialize({
            client_id: activeClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            theme: 'filled_black'
          });
          
          const parent = document.getElementById('google-btn-wrapper');
          if (parent) {
             parent.innerHTML = '';
             google.accounts.id.renderButton(parent, {
               theme: 'filled_black',
               size: 'large',
               shape: 'pill',
               width: '320',
               logo_alignment: 'center'
             });
          }
          setIsInitializing(false);
        } catch (e) {
          console.error("GSI Core Error:", e);
          setIsInitializing(false);
        }
      } else if (isMounted) {
        setTimeout(initGSI, 300);
      }
    };
    
    initGSI();
    return () => { isMounted = false; };
  }, [activeClientId, handleCredentialResponse]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white selection:bg-[var(--accent)]/30">
      <div className="film-grain"></div>
      <div className="cinematic-vignette"></div>

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-[var(--accent)]/[0.03] blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-2xl px-12 z-50 flex flex-col items-center animate-fade-in">
        
        <div className="mb-24 text-center">
          <h1 className="font-brand text-5xl md:text-7xl font-light tracking-[0.5em] mb-6 animate-slide-up opacity-90 transition-all duration-1000">
            OBSCURA
          </h1>
          <div className="flex items-center justify-center gap-4 text-zinc-600 font-mono text-[9px] tracking-[0.3em] uppercase">
            <span>SYSTEM V1.0</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
            <span>CINEMATIC INTELLIGENCE</span>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-12">
          <div className="flex flex-col gap-4">
            {activeClientId ? (
               <div id="google-btn-wrapper" className={`w-full min-h-[50px] flex justify-center transition-all duration-1000 ${isInitializing ? 'opacity-0 scale-95' : 'opacity-80 hover:opacity-100'}`}>
                 {isInitializing && <div className="text-zinc-800 font-mono text-[9px] animate-pulse tracking-widest">Waking Neural Link...</div>}
               </div>
            ) : (
               <div className="text-center p-4 border border-white/5 rounded-2xl bg-white/[0.02]">
                 <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Secure Login Unavailable</p>
                 <p className="text-[9px] text-zinc-700 mt-1">VITE_GOOGLE_CLIENT_ID Required for Production</p>
               </div>
            )}
          </div>

          <div className="flex items-center gap-4 text-zinc-800">
            <div className="h-[1px] flex-1 bg-white/5"></div>
            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-600 select-none">OR</span>
            <div className="h-[1px] flex-1 bg-white/5"></div>
          </div>

          <div className="flex flex-col items-center">
            <button 
              onClick={handleGuestLogin}
              className="group flex items-center gap-3 text-zinc-600 hover:text-white transition-all duration-500 text-[10px] font-black tracking-[0.3em] uppercase"
            >
              GUEST OPERATOR
              <svg className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <footer className="fixed bottom-12 left-0 right-0 z-50 flex flex-col items-center gap-4 pointer-events-none">
        <div className="flex items-center gap-3 text-zinc-800 font-mono text-[9px] tracking-tighter">
          <span>SERVER_STATUS:</span>
          <span className="text-zinc-500 font-bold uppercase tracking-widest">Ready</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse-status"></div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
