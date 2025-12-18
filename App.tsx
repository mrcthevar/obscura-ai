import React, { useState, useEffect } from 'react';
import { AppState, UserProfile } from './types';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import FlashlightCursor from './components/FlashlightCursor';
import { ApiKeyContext } from './contexts/ApiKeyContext';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Directly use mandated environment key
  const apiKey = process.env.API_KEY || '';

  useEffect(() => {
    const storedUser = localStorage.getItem('obscura_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setAppState(AppState.DASHBOARD);
    }
  }, []);

  useEffect(() => {
    if (appState === AppState.LANDING) {
      document.title = 'OBSCURA.AI | Cinematic Intelligence Suite';
    }
  }, [appState]);

  const handleSignIn = (userProfile: UserProfile) => {
    localStorage.setItem('obscura_user', JSON.stringify(userProfile));
    setUser(userProfile);
    setAppState(AppState.DASHBOARD);
  };

  const handleLogout = () => {
    localStorage.removeItem('obscura_user');
    setUser(null);
    setAppState(AppState.LANDING);
  };

  return (
    <ApiKeyContext.Provider value={apiKey}>
      <FlashlightCursor />
      
      {appState === AppState.LANDING && (
        <Landing onSignIn={handleSignIn} />
      )}

      {appState === AppState.DASHBOARD && user && (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </ApiKeyContext.Provider>
  );
};

export default App;