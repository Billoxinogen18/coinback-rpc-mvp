import React, { useCallback, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import RpcConfiguration from './components/RpcConfiguration';
import CbkPanel from './components/CbkPanel';
import Dashboard from './components/Dashboard';
import RewardsClaim from './components/RewardsClaim';
import { ShieldCheck, Loader2 as GlobalLoader } from 'lucide-react';

function App() {
  const { isAuthenticated, loadingAuth, refreshUserProfile } = useAuth();
  const [dataVersion, setDataVersion] = useState(0);

  const handleDataChange = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);
  
  return (
    <div className="min-h-screen bg-bgBase text-textPrimary flex flex-col selection:bg-accent/30">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {loadingAuth ? (
          <div className="flex flex-col items-center justify-center h-full pt-16">
            <GlobalLoader className="animate-spin h-12 w-12 text-primary" />
            <p className="mt-4 text-textSecondary">Initializing Application...</p>
          </div>
        ) : isAuthenticated ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <section className="lg:col-span-1 space-y-6 lg:space-y-8">
              <RpcConfiguration />
              <CbkPanel onAction={handleDataChange} />
            </section>
            <section className="lg:col-span-2 space-y-6 lg:space-y-8">
              <Dashboard onDataChange={handleDataChange} />
              <RewardsClaim onRewardsClaimed={handleDataChange} />
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="text-center p-12 neumorphic-outset card-base max-w-2xl mx-auto">
              <ShieldCheck size={72} className="mx-auto text-primary mb-6" />
              <h2 className="text-4xl font-bold">Welcome to Coinback RPC</h2>
              <p className="text-textSecondary text-lg mt-4">Connect your wallet and sign in to access your dashboard.</p>
            </div>
          </div>
        )}
      </main>
      <footer className="py-6 mt-12 text-center text-textSecondary text-sm glassmorphic">
        <p>© {new Date().getFullYear()} Coinback RPC. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
export default App;