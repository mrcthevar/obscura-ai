import React, { useState, useEffect, useCallback, Component } from 'react';
import { AppState, UserProfile } from './types';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import Gatekeeper from './components/Gatekeeper';
import FlashlightCursor from './components/FlashlightCursor';
import { ApiKeyContext } from './contexts/ApiKeyContext';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

// Error Boundary to prevent "Black Screen of Death"
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    console.error("Critical System Failure:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center p-8 font-mono text-xs z-50 relative">
          <div className="max-w-xl w-full">
            <h1 className="text-xl mb-4 font-bold tracking-widest border-b border-red-900 pb-4">SYSTEM_FAILURE_DETECTED</h1>
            <p className="mb-4 text-zinc-400">The neural link encountered a critical exception.</p>
            <pre className="bg-[#111] p-6 rounded-xl overflow-auto border border-red-900/50 mb-8 font-mono text-[10px] leading-relaxed">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => {
                localStorage.clear(); 
                window.location.reload();
              }}
              className="w-full border border-red-500/50 text-red-500 px-6 py-4 hover:bg-red-900/20 rounded-xl transition-all uppercase tracking-[0.2em] font-bold"
            >
              Initiate Hard Reset
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