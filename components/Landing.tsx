
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  const buttonRenderedRef = useRef(false);

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
          if (parent && !buttonRenderedRef.current) {
             parent.innerHTML = '';
             google.accounts.id.renderButton(parent, {
               theme: 'filled_black',
               size: 'large',
               shape: 'pill',
               width: '320',
               logo_alignment: 'center'
             });
             buttonRenderedRef.current = true;
          }
          setIsInitializing(false);
        } catch (e) {
          console.error("GSI Error:", e);
          setIsInitializing(false);
        }
      } else if (isMounted) {
        setTimeout(initGSI, 500);
      }
    };
    
    initGSI();
    return () => { isMounted = false; };
  }, [activeClientId, handleCredentialResponse]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white selection:bg-[var(--accent)]/30 relative overflow-hidden">
      <div className="film-grain"></div>
      <div className="cinematic-vignette"></div>

      {/* Ambient Glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-[var(--accent)]/[0.03] blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-2xl px-12 z-[60] flex flex-col items-center animate-fade-in">
        
        <div className="mb-24 text-center">
          <h1 className="font-brand text-5xl md:text-7xl font-light tracking-[0.5em] mb-6 animate-slide-up opacity-90">
            OBSCURA
          </h1>
          <div className="flex items-center justify-center gap-4 text-zinc-600 font-mono text-[9px] tracking-[0.3em] uppercase">
            <span>SYSTEM V1.0</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
            <span>CINEMATIC INTELLIGENCE</span>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-10">
          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={handleGuestLogin}
              className="w-full py-6 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(255,255,255,0.05)] hover:bg-[var(--accent)] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all duration-500 active:scale-95 z-10"
            >
              Enter Studio
            </button>
            <p className="text-[9px] font-mono text-zinc-700 tracking-widest uppercase opacity-50 select-none">Guest Operator Mode</p>
          </div>

          {activeClientId && (
            <>
              <div className="flex items-center gap-4 text-zinc-900">
                <div className="h-[1px] flex-1 bg-white/5"></div>
                <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-700 select-none">OR SIGN IN</span>
                <div className="h-[1px] flex-1 bg-white/5"></div>
              </div>

              <div id="google-btn-wrapper" className={`w-full min-h-[50px] flex justify-center transition-all duration-1000 ${isInitializing ? 'opacity-0 scale-95' : 'opacity-80 hover:opacity-100'}`}>
                {isInitializing && <div className="text-zinc-800 font-mono text-[9px] animate-pulse tracking-widest uppercase">Initializing Secure Auth...</div>}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-12 text-[9px] font-mono text-zinc-900 tracking-[0.5em] uppercase pointer-events-none">
        Obscura OS // Synthesis Engine v1.0.8
      </div>
    </div>
  );
};

export default Landing;
