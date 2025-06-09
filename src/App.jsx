import React, { useCallback, useState } from 'react';
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

  const handleDataChange = useCallback(() => {
    setDataVersion(v => v + 1);
  }, []);
  
  return (
    <div className="min-h-screen text-textPrimary flex flex-col selection:bg-accent/30">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex-grow w-full max-w-7xl">
        {loadingAuth ? (
          <div className="flex flex-col items-center justify-center h-full pt-20">
            <GlobalLoader className="animate-spin h-14 w-14 text-primary" />
            <p className="mt-5 text-textSecondary text-lg">Initializing Application...</p>
          </div>
        ) : isAuthenticated ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <section className="lg:col-span-1 space-y-8 lg:space-y-10">
              <RpcConfiguration />
              <CbkPanel onAction={handleDataChange} />
            </section>
            <section className="lg:col-span-2 space-y-8 lg:space-y-10">
              <Dashboard onDataChange={handleDataChange} />
              <RewardsClaim onRewardsClaimed={handleDataChange} />
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-16">
            <div className="text-center p-8 sm:p-12 neumorphic-outset card-base max-w-2xl mx-auto transition-transform hover:scale-[1.02]">
              <ShieldCheck size={72} className="mx-auto text-primary mb-6 drop-shadow-[0_0_15px_hsla(var(--color-primary-hsl)/0.5)]" />
              <h2 className="text-4xl font-bold">Welcome to Coinback RPC</h2>
              <p className="text-textSecondary text-lg mt-4">Connect your wallet and sign in to access your dashboard.</p>
            </div>
          </div>
        )}
      </main>
      <footer className="py-6 mt-16 text-center text-textSecondary text-sm glassmorphic">
        <p>© {new Date().getFullYear()} Coinback RPC. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
export default App;