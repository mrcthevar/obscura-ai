
import React, { useState, useEffect } from 'react';
import { AppState, UserProfile } from './types';
import Landing from './components/Landing';
import Gatekeeper from './components/Gatekeeper';
import Dashboard from './components/Dashboard';
import FlashlightCursor from './components/FlashlightCursor';
import { ApiKeyContext } from './contexts/ApiKeyContext';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Directly use mandated environment key from the shimmed process.env
  const apiKey = process.env.API_KEY || '';

  useEffect(() => {
    const storedUser = localStorage.getItem('obscura_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // If we already have a user, we check if we need to gate them
      setAppState(AppState.GATEKEEPER);
    }
  }, []);

  const handleSignIn = (userProfile: UserProfile) => {
    localStorage.setItem('obscura_user', JSON.stringify(userProfile));
    setUser(userProfile);
    setAppState(AppState.GATEKEEPER);
  };

  const handleLogout = () => {
    localStorage.removeItem('obscura_user');
    setUser(null);
    setAppState(AppState.LANDING);
  };

  const handleGatePassed = () => {
    setAppState(AppState.DASHBOARD);
  };

  return (
    <ApiKeyContext.Provider value={apiKey}>
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
