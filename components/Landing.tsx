import React, { useEffect, useState, useCallback } from 'react';
import { UserProfile } from '../types';

declare global {
  interface Window {
    google: any;
  }
}

interface LandingProps {
  onSignIn: (user: UserProfile) => void;
}

const Landing: React.FC<LandingProps> = ({ onSignIn }) => {
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  
  // Initialize state from Storage or Env
  const [activeClientId, setActiveClientId] = useState<string>(() => {
     return import.meta.env?.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('obscura_client_id') || '';
  });
  
  const [manualClientId, setManualClientId] = useState('');

  const decodeJwt = (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Failed to decode JWT", e);
      return null;
    }
  };

  const handleCredentialResponse = useCallback((response: any) => {
    if (response.credential) {
      const payload = decodeJwt(response.credential);
      if (payload) {
        const user: UserProfile = {
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
          isGuest: false
        };
        onSignIn(user);
      }
    }
  }, [onSignIn]);

  const handleGuestLogin = () => {
    const guestUser: UserProfile = {
      name: "Guest Operator",
      email: null,
      picture: "", 
      isGuest: true
    };
    onSignIn(guestUser);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualClientId.trim()) {
      const newId = manualClientId.trim();
      localStorage.setItem('obscura_client_id', newId);
      setActiveClientId(newId); // Update state immediately
      setShowConfig(false); // Close config
    }
  };

  const handleClearConfig = () => {
    localStorage.removeItem('obscura_client_id');
    setActiveClientId(import.meta.env?.VITE_GOOGLE_CLIENT_ID || '');
    window.location.reload(); // Clean reload to clear GSI state
  };

  // Initialize Google Button whenever Client ID changes
  useEffect(() => {
    if (!activeClientId) return;

    // Retry mechanism to wait for Google Script
    const initGSI = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: activeClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            theme: 'filled_black'
          });

          const parent = document.getElementById('google-btn-wrapper');
          if (parent) {
             // Clear previous contents if any
             parent.innerHTML = '';
             window.google.accounts.id.renderButton(parent, {
               theme: 'filled_black',
               size: 'large',
               shape: 'pill',
               width: '280',
               logo_alignment: 'left'
             });
          }
        } catch (e) {
          console.error("GSI Initialization Error:", e);
          setError("Could not load Google Sign-In. Verify Client ID.");
        }
      } else {
        // Retry if script not yet loaded
        setTimeout(initGSI, 500);
      }
    };

    initGSI();
  }, [activeClientId, handleCredentialResponse]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#050505] font-inter">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/40 to-[#050505] z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 z-0 pointer-events-none"></div>
      
      {/* Content Container */}
      <div className="relative z-10 max-w-5xl w-full px-6 flex flex-col items-center animate-fade-in-up">
        
        {/* Brand Section */}
        <div className="text-center mb-8 space-y-3">
          <h1 className="text-3xl md:text-5xl font-cinzel text-white tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            OBSCURA<span className="text-[#FFD700]">.AI</span>
          </h1>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mx-auto opacity-50"></div>
          <p className="text-xs md:text-sm text-neutral-400 font-light tracking-[0.3em] uppercase">
            Cinematic Intelligence Suite
          </p>
        </div>

        {/* Feature Highlights (The "Why") */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16 w-full max-w-4xl opacity-80">
          {[
            { label: 'Lighting', sub: 'Reverse-Engineering' },
            { label: 'Storyboard', sub: 'Generative Visualization' },
            { label: 'Analysis', sub: 'Script Breakdown' },
            { label: 'Directing', sub: 'Blocking & Shot Lists' }
          ].map((item, i) => (
            <div key={i} className="border border-neutral-800 bg-neutral-900/30 p-4 text-center rounded backdrop-blur-sm">
              <div className="text-[#FFD700] font-cinzel text-sm md:text-lg mb-1">{item.label}</div>
              <div className="text-neutral-500 text-[10px] uppercase tracking-wider">{item.sub}</div>
            </div>
          ))}
        </div>
        
        {/* Auth Section */}
        <div className="w-full max-w-xs flex flex-col gap-5 items-center bg-[#0A0A0A] p-8 border border-neutral-800 rounded-2xl shadow-2xl relative">
          
          {/* Header for Auth Box */}
          <div className="text-neutral-500 text-xs uppercase tracking-widest mb-2">Identify Protocols</div>

          {/* 1. Google Button */}
          <div className="w-full min-h-[44px] flex justify-center">
             {activeClientId ? (
               <div id="google-btn-wrapper" className="w-full flex justify-center min-h-[40px]"></div>
             ) : (
               <button 
                 onClick={() => setShowConfig(true)}
                 className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-3 px-6 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-900"
               >
                 <span>⚠ CONFIG REQUIRED</span>
               </button>
             )}
          </div>

          <div className="flex items-center w-full gap-4">
             <div className="h-px bg-neutral-800 flex-1"></div>
             <span className="text-neutral-700 text-[10px]">OR</span>
             <div className="h-px bg-neutral-800 flex-1"></div>
          </div>

          {/* 2. Guest Button */}
          <button 
            onClick={handleGuestLogin}
            className="w-full group relative overflow-hidden rounded-full border border-neutral-700 hover:border-[#FFD700] transition-colors"
          >
            <div className="absolute inset-0 w-0 bg-[#FFD700] transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
            <div className="relative text-neutral-400 group-hover:text-white font-cinzel text-sm py-3 px-6 tracking-wider">
              INITIATE GUEST MODE
            </div>
          </button>

          {error && (
            <div className="text-red-500 text-[10px] text-center mt-2 leading-tight">
               {error}
            </div>
          )}
        </div>

        {/* Footer / Legal */}
        <div className="mt-16 flex flex-col items-center gap-4">
           <div className="flex gap-6 text-[10px] text-neutral-600 uppercase tracking-widest">
              <span>v1.0.4 Beta</span>
              <span>•</span>
              <button onClick={() => setShowConfig(!showConfig)} className="hover:text-white transition-colors">System Config</button>
           </div>
           
           {/* Config Panel */}
           {showConfig && (
             <div className="mt-4 p-4 bg-neutral-900 border border-neutral-800 rounded animate-fade-in w-full max-w-md shadow-xl z-20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[#FFD700] text-xs font-bold uppercase">Manual Override</h3>
                  {activeClientId && (
                    <button onClick={handleClearConfig} className="text-[10px] text-red-500 hover:underline">Reset Config</button>
                  )}
                </div>
                
                {!activeClientId ? (
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Paste Client ID..."
                      value={manualClientId}
                      onChange={(e) => setManualClientId(e.target.value)}
                      className="flex-1 bg-black border border-neutral-700 text-white text-xs px-3 py-2 rounded outline-none focus:border-[#FFD700]"
                    />
                    <button type="submit" className="bg-[#FFD700] text-black font-bold text-xs px-3 rounded hover:bg-white">
                      SAVE
                    </button>
                  </form>
                ) : (
                  <div className="text-green-500 text-xs font-mono break-all p-2 bg-black rounded border border-neutral-800">
                    Active Client ID: <br/>
                    {activeClientId.substring(0, 15)}...
                  </div>
                )}
                <div className="mt-2 text-[9px] text-neutral-500">
                  Client ID must be authorized for this origin in Google Cloud Console.
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default Landing;