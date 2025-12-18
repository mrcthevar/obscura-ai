
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { UserProfile } from '../types';

interface LandingProps {
  onSignIn: (user: UserProfile) => void;
}

const Landing: React.FC<LandingProps> = ({ onSignIn }) => {
  const [activeClientId] = useState<string>(() => {
     try {
       const win = window as any;
       // Safe access to environment variables
       const metaEnv = (import.meta as any)?.env || {};
       return metaEnv.VITE_GOOGLE_CLIENT_ID || 
              win.process?.env?.VITE_GOOGLE_CLIENT_ID || '';
     } catch (e) {
       return '';
     }
  });

  const [isGsiReady, setIsGsiReady] = useState(false);
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
    if (!activeClientId) return;
    
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
          setIsGsiReady(true);
        } catch (e) {
          console.error("GSI Init Fault:", e);
        }
      } else if (isMounted) {
        setTimeout(initGSI, 500);
      }
    };
    
    initGSI();
    return () => { isMounted = false; };
  }, [activeClientId, handleCredentialResponse]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white selection:bg-[var(--accent)]/30 relative overflow-hidden">
      {/* Background VFX - handled by global CSS but kept safe here */}
      
      {/* Content Container - Ensure High Z-Index */}
      <div className="w-full max-w-2xl px-12 z-[60] flex flex-col items-center animate-fade-in relative">
        
        <div className="mb-24 text-center">
          <h1 className="font-brand text-5xl md:text-7xl font-light tracking-[0.5em] mb-6 opacity-100 transition-opacity duration-1000">
            OBSCURA
          </h1>
          <div className="flex items-center justify-center gap-4 text-zinc-600 font-mono text-[9px] tracking-[0.3em] uppercase">
            <span>SYSTEM V1.0</span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-800"></span>
            <span>CINEMATIC INTELLIGENCE</span>
          </div>
        </div>

        <div className="w-full max-w-sm space-y-10">
          {/* Main Action - Always Visible */}
          <div className="flex flex-col items-center gap-6">
            <button 
              onClick={handleGuestLogin}
              className="w-full py-6 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.5em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:bg-[var(--accent)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all duration-500 active:scale-95 cursor-pointer relative z-[100]"
            >
              Enter Studio
            </button>
            <p className="text-[9px] font-mono text-zinc-700 tracking-widest uppercase opacity-60 select-none">Guest Operator Access</p>
          </div>

          {/* Secure Auth Option */}
          {activeClientId && (
            <div className="space-y-10 animate-fade-in delay-300">
              <div className="flex items-center gap-4 text-zinc-900">
                <div className="h-[1px] flex-1 bg-white/10"></div>
                <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-700 select-none">OR SECURE LINK</span>
                <div className="h-[1px] flex-1 bg-white/10"></div>
              </div>

              <div id="google-btn-wrapper" className={`w-full min-h-[50px] flex justify-center transition-all duration-1000 ${!isGsiReady ? 'opacity-30 grayscale' : 'opacity-100'}`}>
                {!isGsiReady && <div className="text-zinc-800 font-mono text-[9px] animate-pulse tracking-widest uppercase">Syncing Keys...</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-12 w-full text-center text-[9px] font-mono text-zinc-900 tracking-[0.5em] uppercase pointer-events-none z-[60]">
        Obscura OS // Synthesis Engine v1.0.9
      </div>
    </div>
  );
};

export default Landing;
