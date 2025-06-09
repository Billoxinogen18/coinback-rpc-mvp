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
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-grow w-full max-w-7xl">
        {loadingAuth ? (
          <div className="flex flex-col items-center justify-center h-full pt-20 text-center">
            <GlobalLoader className="animate-spin h-12 w-12 text-primary" />
            <p className="mt-4 text-textSecondary text-lg">Connecting to Coinback...</p>
          </div>
        ) : isAuthenticated ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Dashboard onDataChange={handleDataChange} />
              <RewardsClaim onRewardsClaimed={handleDataChange} />
            </div>
            <div className="lg:col-span-1 space-y-8">
              <RpcConfiguration />
              <CbkPanel onAction={handleDataChange} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full pt-12 text-center">
            <div className="card max-w-lg mx-auto animate-fade-in-up">
              <ShieldCheck size={72} className="mx-auto text-primary drop-shadow-glow-primary mb-6" />
              <h2 className="text-4xl font-bold text-textPrimary">Welcome to Coinback RPC</h2>
              <p className="text-textSecondary text-lg mt-4">Your gateway to cashback on every transaction.</p>
              <p className="text-textSecondary mt-1">Connect your wallet to begin.</p>
            </div>
          </div>
        )}
      </main>
      <footer className="py-8 text-center text-textSecondary/50 text-sm">
        <p>© {new Date().getFullYear()} Coinback RPC. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
export default App;