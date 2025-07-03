import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { testRpcEndpoint } from './services/api';

// Make the test function available globally for debugging
if (import.meta.env.DEV) {
  window.testRpcEndpoint = testRpcEndpoint;
  console.log('✅ Development mode detected - RPC testing tools available');
  console.log('Run window.testRpcEndpoint() in the console to test the RPC endpoint');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster position="top-right" />
    </AuthProvider>
  </React.StrictMode>
);