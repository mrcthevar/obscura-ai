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
  
  // Initialize API Key from Storage or Env
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || import.meta.env?.VITE_GEMINI_API_KEY || '';
  });

  useEffect(() => {
    // Check local storage on mount
    const storedUser = localStorage.getItem('obscura_user');

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      checkAccess(parsedUser);
    }
  }, []);

  // Helper to check if we have API keys to run the dashboard
  const checkAccess = (userProfile: UserProfile) => {
    // We check the state 'apiKey' which is already initialized from storage/env
    if (apiKey) {
      setAppState(AppState.DASHBOARD);
    } else {
      // If we are logged in (Guest or Google) but have NO API Key, go to Gatekeeper
      setAppState(AppState.GATEKEEPER);
    }
  };

  // Reset Title on Landing
  useEffect(() => {
    if (appState === AppState.LANDING) {
      document.title = 'OBSCURA.AI | Cinematic Intelligence Suite';
    }
  }, [appState]);

  const handleSignIn = (userProfile: UserProfile) => {
    localStorage.setItem('obscura_user', JSON.stringify(userProfile));
    setUser(userProfile);
    checkAccess(userProfile);
  };

  const handleGatekeeperSubmit = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    setApiKey(key); // Update Context
    setAppState(AppState.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('obscura_user');
    // Keep API key in local storage for convenience, but clear user session
    setUser(null);
    setAppState(AppState.LANDING);
  };

  return (
    <ApiKeyContext.Provider value={apiKey}>
      <FlashlightCursor />
      
      {appState === AppState.LANDING && (
        <Landing onSignIn={handleSignIn} />
      )}

      {appState === AppState.GATEKEEPER && (
        <Gatekeeper onSubmit={handleGatekeeperSubmit} />
      )}

      {appState === AppState.DASHBOARD && user && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </ApiKeyContext.Provider>
  );
};

export default App;