
import React, { useState, useEffect } from 'react';
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
    // Attempt to hydrate key from shim or storage immediately
    return process.env.API_KEY || localStorage.getItem('obscura_api_key') || '';
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('obscura_user');
    const isValidKey = runtimeKey && runtimeKey.length > 5;

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Strict routing: Must have user AND key for Dashboard
      if (isValidKey) {
        setAppState(AppState.DASHBOARD);
      } else {
        setAppState(AppState.GATEKEEPER);
      }
    } else {
      setAppState(AppState.LANDING);
    }
  }, [runtimeKey]);

  const handleSignIn = (userProfile: UserProfile) => {
    localStorage.setItem('obscura_user', JSON.stringify(userProfile));
    setUser(userProfile);
    
    // Check key status immediately on sign in
    const currentKey = process.env.API_KEY || localStorage.getItem('obscura_api_key') || '';
    if (!currentKey || currentKey.length < 5) {
      setAppState(AppState.GATEKEEPER);
    } else {
      setRuntimeKey(currentKey);
      setAppState(AppState.DASHBOARD);
    }
  };

  const handleGatePassed = (key?: string) => {
    if (key) {
      setRuntimeKey(key);
      if (window.process?.env) {
        window.process.env.API_KEY = key;
      }
    }
    setAppState(AppState.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('obscura_user');
    // We clear the user and force back to landing
    setUser(null);
    setAppState(AppState.LANDING);
  };

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
