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
    onSignIn({
      name: "Guest Producer",
      email: null,
      picture: "", 
      isGuest: true
    });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualClientId.trim()) {
      const newId = manualClientId.trim();
      localStorage.setItem('obscura_client_id', newId);
      setActiveClientId(newId);
      setShowConfig(false);
    }
  };

  // Initialize Google Button
  useEffect(() => {
    if (!activeClientId) return;
    const initGSI = () => {
      if (window.google && window.google.accounts) {
        try {
          window.google.accounts.id.initialize({
            client_id: activeClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            theme: 'filled_black'
          });
          const parent = document.getElementById('google-btn-wrapper');
          if (parent) {
             parent.innerHTML = '';
             window.google.accounts.id.renderButton(parent, {
               theme: 'filled_black',
               size: 'large',
               shape: 'pill',
               width: '320',
               logo_alignment: 'center'
             });
          }
        } catch (e) {
          console.error("GSI Init Error", e);
        }
      } else {
        setTimeout(initGSI, 500);
      }
    };
    initGSI();
  }, [activeClientId, handleCredentialResponse]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#161618] relative">
      
      {/* Background Gradient - Subtle */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-600/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md px-8 z-10 flex flex-col items-center">
        
        {/* Logo */}
        <div className="mb-12 text-center">
          <h1 className="font-brand text-4xl text-white tracking-widest mb-2">OBSCURA</h1>
          <p className="text-[#8E8E93] text-sm tracking-wide">Cinematic Intelligence Suite</p>
        </div>

        {/* Login Container */}
        <div className="w-full space-y-6">
          
          <div className="min-h-[44px] flex justify-center w-full">
            {activeClientId ? (
               <div id="google-btn-wrapper" className="w-full flex justify-center"></div>
            ) : (
               <button 
                 onClick={() => setShowConfig(true)}
                 className="w-full bg-[#2C2C2E] hover:bg-[#3A3A3C] text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors border border-white/5"
               >
                 Configure Client ID
               </button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#161618] px-2 text-[#636366]">Or continue as</span>
            </div>
          </div>

          <button 
            onClick={handleGuestLogin}
            className="w-full bg-transparent hover:bg-white/5 text-white border border-white/20 py-3 px-4 rounded-lg text-sm font-medium transition-all"
          >
            Guest Operator
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
           <button 
             onClick={() => setShowConfig(!showConfig)} 
             className="text-[10px] text-[#48484A] hover:text-[#8E8E93] transition-colors uppercase tracking-widest"
           >
             System Config
           </button>
        </div>

        {/* Config Modal (Inline) */}
        {showConfig && (
          <div className="mt-6 w-full animate-fade-in p-4 bg-[#1C1C1E] rounded-xl border border-white/10">
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs text-[#8E8E93]">Client ID Configuration</span>
               {activeClientId && <button onClick={() => {localStorage.removeItem('obscura_client_id'); window.location.reload();}} className="text-[10px] text-red-400">Reset</button>}
             </div>
             {!activeClientId ? (
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Paste Google Client ID"
                    value={manualClientId}
                    onChange={(e) => setManualClientId(e.target.value)}
                    className="flex-1 bg-[#2C2C2E] text-white text-xs px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-[#FFD700]"
                  />
                  <button type="submit" className="bg-white text-black text-xs px-3 rounded-lg font-medium">Save</button>
                </form>
             ) : (
                <div className="text-[10px] text-green-500 font-mono truncate">{activeClientId}</div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;