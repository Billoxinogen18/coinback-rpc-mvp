import React, { useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import RpcConfiguration from './components/RpcConfiguration';
import SimulateTransaction from './components/SimulateTransaction';
import Dashboard from './components/Dashboard';
import RewardsClaim from './components/RewardsClaim';
import CbkPanel from './components/CbkPanel';
import { ShieldCheck, AlertTriangle, Loader2 as GlobalLoader } from 'lucide-react';

function App() {
  const { userId, isAuthenticated, loadingAuth, userProfile } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChange = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-bgBase flex flex-col items-center justify-center text-textPrimary">
        <GlobalLoader className="animate-spin h-16 w-16 text-primary mb-6" />
        <p className="text-2xl font-semibold text-primary">Initializing Coinback Interface</p>
        <p className="text-textSecondary">Please wait a moment...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgBase text-textPrimary flex flex-col selection:bg-accent/30">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {!isAuthenticated || !userId ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="text-center p-8 sm:p-12 neumorphic-outset card-base max-w-2xl mx-auto animate-pulseShadow">
              <ShieldCheck size={72} className="mx-auto text-primary mb-6 drop-shadow-lg" />
              <h2 className="text-4xl font-bold text-primaryDark mb-4">Welcome to Coinback RPC</h2>
              <p className="text-textSecondary mb-8 text-lg">
                Experience the future of Ethereum transactions. Earn cashback and enjoy superior MEV protection.
              </p>
              <div className="info-box info-box-yellow">
                  <div className="flex items-start">
                      <AlertTriangle size={30} className="mr-3 flex-shrink-0 text-yellowHighlight"/>
                      <div>
                          <h3 className="font-semibold text-lg">Authentication Required</h3>
                          <p>
                          Securely connecting... If this message persists, please check your browser console or ensure your Firebase setup is correct.
                          </p>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <section className="lg:col-span-1 space-y-6 lg:space-y-8">
              <RpcConfiguration />
              <SimulateTransaction onTransactionSimulated={handleDataChange} />
              <CbkPanel onCbkAction={handleDataChange} />
            </section>

            <section className="lg:col-span-2 space-y-6 lg:space-y-8">
              <Dashboard refreshTrigger={refreshKey} />
              <RewardsClaim onRewardsClaimed={handleDataChange} />
            </section>
          </div>
        )}
      </main>
      <footer className="py-8 text-center text-textSecondary text-sm glassmorphic mt-12 border-t-0">
        <p>&copy; {new Date().getFullYear()} Coinback RPC. Your Transactions, Your Rewards.</p>
        {userId && isAuthenticated && (
            <>
                <p className="text-xs mt-2 opacity-80">User ID: {userId}</p>
                {userProfile?.cbkBalance !== undefined && (
                    <p className="text-xs opacity-80">CBK Balance: {userProfile.cbkBalance.toLocaleString()} CBK</p>
                )}
            </>
        )}
      </footer>
    </div>
  );
}
export default App;
