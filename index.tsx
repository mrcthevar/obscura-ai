
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Runtime shim to prevent "process is not defined" in browser
// Prioritize localStorage for manual injection if env vars aren't available
if (typeof (window as any).process === 'undefined' || !(window as any).process.env) {
  const storedKey = localStorage.getItem('obscura_api_key');
  (window as any).process = { 
    env: {
       API_KEY: storedKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
    } 
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
