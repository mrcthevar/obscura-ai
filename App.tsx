
import React, { useState, useEffect, useCallback, ErrorInfo, ReactNode } from 'react';
import { AppState, UserProfile } from './types';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import Gatekeeper from './components/Gatekeeper';
import FlashlightCursor from './components/FlashlightCursor';
import { ApiKeyContext } from './contexts/ApiKeyContext';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Error Boundary to prevent "Black Screen of Death"
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  
  // Explicitly declare props to satisfy TypeScript if inheritance inference fails
  declare props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: ErrorInfo) {
    console.error("Critical System Failure:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-red-500 flex flex-col items-center justify-center p-8 font-mono text-xs z-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-red-900/5 animate-pulse pointer-events-none"></div>
          <div className="max-w-xl w-full relative z-10 border border-red-900/30 bg-black/50 backdrop-blur-xl p-10 rounded-[2rem] shadow-[0_0_50px_rgba(220,38,38,0.2)]">
            <div className="flex items-center gap-4 mb-8 border-b border-red-900/30 pb-6">
               <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
               <h1 className="text-xl font-bold tracking-[0.3em] text-red-500 uppercase">System Failure</h1>
            </div>
            
            <p className="mb-6 text-zinc-400 leading-relaxed font-light">
               The neural uplink encountered a critical exception. This session has been terminated to protect data integrity.
            </p>
            
            <div className="bg-[#0a0a0a] p-6 rounded-xl overflow-auto border border-red-900/20 mb-8 font-mono text-[10px] leading-relaxed max-h-48 custom-scrollbar">
              <span className="text-red-700 block mb-2">// ERROR LOG:</span>
              {this.state.error?.toString()}
            </div>
            
            <button 
              onClick={() => {
                // Attempt soft reload first, clearing session but keeping local storage
                window.location.reload();
              }}
              className="w-full bg-red-600 hover:bg-red-500 text-black px-6 py-4 rounded-xl transition-all uppercase tracking-[0.2em] font-black text-[10px] shadow-lg active:scale-95"
            >
              Reboot System
            </button>
            <button 
              onClick={() => {
                 if (confirm("This will wipe all local data. Continue?")) {
                    localStorage.clear();
                    window.location.reload();
                 }
              }}
              className="w-full mt-4 text-red-800 hover:text-red-500 transition-colors uppercase tracking-[0.2em] font-bold text-[9px]"
            >
              Perform Hard Reset (Clear Data)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Use a safer initializer for the runtime key
  const [runtimeKey, setRuntimeKey] = useState<string>(() => {
    try {
      const win = window as any;
      const envKey = win.process?.env?.API_KEY;
      const storedKey = localStorage.getItem('obscura_api_key');
      return envKey || storedKey || '';
    } catch {
      return '';
    }
  });

  // Sync state on mount and handle auto-login
  useEffect(() => {
    const storedUser = localStorage.getItem('obscura_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        const win = window as any;
        const key = win.process?.env?.API_KEY || localStorage.getItem('obscura_api_key') || '';
        
        if (key && key.length > 5) {
          setAppState(AppState.DASHBOARD);
        } else {
          setAppState(AppState.GATEKEEPER);
        }
      } catch (e) {
        console.error("Auth hydration failure", e);
        localStorage.removeItem('obscura_user');
        setAppState(AppState.LANDING);
      }
    }
  }, []);

  const handleSignIn = useCallback((userProfile: UserProfile) => {
    localStorage.setItem('obscura_user', JSON.stringify(userProfile));
    setUser(userProfile);
    
    const win = window as any;
    const currentKey = win.process?.env?.API_KEY || localStorage.getItem('obscura_api_key') || '';
    
    if (!currentKey || currentKey.length < 5) {
      setAppState(AppState.GATEKEEPER);
    } else {
      setRuntimeKey(currentKey);
      setAppState(AppState.DASHBOARD);
    }
  }, []);

  const handleGatePassed = useCallback((key?: string) => {
    if (key) {
      setRuntimeKey(key);
      const win = window as any;
      if (!win.process) win.process = { env: {} };
      win.process.env.API_KEY = key;
      localStorage.setItem('obscura_api_key', key);
    }
    setAppState(AppState.DASHBOARD);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('obscura_user');
    setUser(null);
    setAppState(AppState.LANDING);
    window.scrollTo(0, 0);
  }, []);

  // Determine what to render based on state
  const renderView = () => {
    if (appState === AppState.DASHBOARD && user) {
      return <Dashboard user={user} onLogout={handleLogout} />;
    }
    
    if (appState === AppState.GATEKEEPER) {
      return <Gatekeeper onSuccess={handleGatePassed} />;
    }
    
    // Default fallback is always Landing
    return <Landing onSignIn={handleSignIn} />;
  };

  return (
    <ErrorBoundary>
      <ApiKeyContext.Provider value={runtimeKey}>
        <FlashlightCursor />
        {/* Main Content Container with High Z-Index to sit ABOVE the film grain */}
        <div className="min-h-screen bg-[#050505] relative z-20">
          {renderView()}
        </div>
      </ApiKeyContext.Provider>
    </ErrorBoundary>
  );
};

export default App;
