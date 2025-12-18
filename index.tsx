
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Runtime shim to ensure process.env.API_KEY is available
// We initialize it surgically to avoid blowing away platform-injected objects
(function() {
  const win = window as any;
  if (!win.process) win.process = { env: {} };
  if (!win.process.env) win.process.env = {};
  
  // Only set if not already present to respect platform injection
  if (!win.process.env.API_KEY) {
    const storedKey = localStorage.getItem('obscura_api_key');
    const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    win.process.env.API_KEY = storedKey || viteKey || '';
  }
})();

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
