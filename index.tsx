
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * PRODUCTION SHIM: Cloudflare Pages & Browsers don't have 'process'.
 * We surgically inject it before the app mounts to ensure process.env.API_KEY
 * and other critical variables are accessible.
 */
(function() {
  const win = window as any;
  if (!win.process) win.process = { env: {} };
  if (!win.process.env) win.process.env = {};
  
  // Bridge Vite environment variables to the global process object.
  const viteApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const viteClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
  const storedKey = localStorage.getItem('obscura_api_key');
  
  // Priority: 1. Environment Variable, 2. Stored Key from Gatekeeper
  if (!win.process.env.API_KEY) {
    win.process.env.API_KEY = viteApiKey || storedKey || '';
  }
  
  if (!win.process.env.VITE_GOOGLE_CLIENT_ID) {
    win.process.env.VITE_GOOGLE_CLIENT_ID = viteClientId || '';
  }
  
  // Also expose to the global scope for the compiler-friendly 'process' variable
  (win as any).process = win.process;
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
