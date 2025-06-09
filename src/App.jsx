import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import RpcConfiguration from './components/RpcConfiguration';
import CbkPanel from './components/CbkPanel';
import Dashboard from './components/Dashboard';
import RewardsClaim from './components/RewardsClaim';
import { ShieldCheck, Loader2 as GlobalLoader } from 'lucide-react';

function App() {
  const { isAuthenticated, loadingAuth } = useAuth();
  const [dataVersion, setDataVersion] = useState(0);

  const handleDataChange = () => {
    setDataVersion(v => v + 1);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow w-full max-w-7xl">
        {loadingAuth ? (
          <div className="flex flex-col items-center justify-center h-full pt-20 text-center">
            <GlobalLoader className="animate-spin h-12 w-12 text-primary drop-shadow-glow-primary" />
            <p className="mt-6 text-textSecondary text-lg">Connecting to Coinback...</p>
          </div>
        ) : isAuthenticated ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 animate-fade-in-up">
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              <Dashboard onDataChange={handleDataChange} />
              <RewardsClaim onRewardsClaimed={handleDataChange} />
            </div>
            <div className="lg:col-span-1 space-y-6 lg:space-y-8">
              <RpcConfiguration />
              <CbkPanel onAction={handleDataChange} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="glass-panel p-8 sm:p-12 animate-fade-in-up max-w-lg mx-auto">
              <ShieldCheck size={64} className="mx-auto text-primary drop-shadow-glow-primary mb-6" />
              <h2 className="text-3xl font-bold text-textPrimary">Welcome to Coinback RPC</h2>
              <p className="text-textSecondary text-lg mt-4">Your gateway to cashback on every transaction.</p>
              <p className="text-textMuted mt-2">Connect your wallet to begin.</p>
            </div>
          </div>
        )}
      </main>
      <footer className="py-6 mt-16 text-center text-textMuted text-sm">
        <p>© {new Date().getFullYear()} Coinback RPC. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
export default App;