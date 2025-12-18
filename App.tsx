
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, UserProfile } from './types';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import Gatekeeper from './components/Gatekeeper';
import FlashlightCursor from './components/FlashlightCursor';
import { ApiKeyContext } from './contexts/ApiKeyContext';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [runtimeKey, setRuntimeKey] = useState<string>(() => {
    return process.env.API_KEY || localStorage.getItem('obscura_api_key') || '';
  });

  // Sync state on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('obscura_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        const key = process.env.API_KEY || localStorage.getItem('obscura_api_key') || '';
        if (key && key.length > 5) {
          setAppState(AppState.DASHBOARD);
        } else {
          setAppState(AppState.GATEKEEPER);
        }
      } catch (e) {
        localStorage.removeItem('obscura_user');
      }
    }
  }, []);

  const handleSignIn = useCallback((userProfile: UserProfile) => {
    localStorage.setItem('obscura_user', JSON.stringify(userProfile));
    setUser(userProfile);
    
    const currentKey = process.env.API_KEY || localStorage.getItem('obscura_api_key') || '';
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
      if (window.process?.env) {
        window.process.env.API_KEY = key;
      }
      localStorage.setItem('obscura_api_key', key);
    }
    setAppState(AppState.DASHBOARD);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('obscura_user');
    // We clear current runtime user but can keep the API key cached
    setUser(null);
    setAppState(AppState.LANDING);
  }, []);

  return (
    <ApiKeyContext.Provider value={runtimeKey}>
      <FlashlightCursor />
      
      {appState === AppState.LANDING && (
        <Landing onSignIn={handleSignIn} />
      )}

      {appState === AppState.GATEKEEPER && (
        <Gatekeeper onSuccess={handleGatePassed} />
      )}

      {appState === AppState.DASHBOARD && user && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </ApiKeyContext.Provider>
  );
};

export default App;
