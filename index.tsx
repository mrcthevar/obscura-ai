
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Runtime shim to prevent "process is not defined" in browser
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { 
    env: {
       // Attempt to grab from Vite's env if available, otherwise empty
       API_KEY: (import.meta as any).env?.VITE_GEMINI_API_KEY || ''
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
