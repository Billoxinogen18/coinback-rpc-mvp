import React, { useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import RpcConfiguration from './components/RpcConfiguration';
import SimulateTransaction from './components/SimulateTransaction';
import Dashboard from './components/Dashboard';
import RewardsClaim from './components/RewardsClaim';
import { ShieldCheck, AlertTriangle } from 'lucide-react'; 

function App() {
  const { userId, isAuthenticated, loadingAuth } = useAuth(); 
  const [refreshKey, setRefreshKey] = useState(0); 

  const handleDataChange = useCallback(() => {
    setRefreshKey(prevKey => prevKey + 1);
  }, []);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Header /> 
        <div className="flex flex-col items-center justify-center flex-grow">
          <svg className="animate-spin h-10 w-10 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl text-primary-dark">Initializing Application...</p>
          <p className="text-sm text-muted">Please wait while we set things up.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text flex flex-col selection:bg-primary/20">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {!isAuthenticated || !userId ? ( 
          <div className="text-center p-8 sm:p-12 bg-card rounded-xl shadow-medium max-w-2xl mx-auto">
            <ShieldCheck size={56} className="mx-auto text-primary mb-5" />
            <h2 className="text-3xl font-semibold text-primary-dark mb-3">Welcome to Coinback RPC MVP</h2>
            <p className="text-muted mb-6 text-lg">
              This is a demonstration of a cashback RPC service.
            </p>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-700 dark:text-yellow-400">
                <div className="flex items-start">
                    <AlertTriangle size={24} className="mr-3 flex-shrink-0 text-yellow-500"/>
                    <div>
                        <h3 className="font-semibold">Authentication Required</h3>
                        <p className="text-sm">
                        It seems authentication has not completed. This app uses Firebase for (simulated) user accounts. 
                        Please ensure your browser allows third-party cookies if you are in an iframe, or try refreshing the page.
                        </p>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <section className="lg:col-span-1 space-y-6 lg:space-y-8" aria-labelledby="actions-heading">
              <h2 id="actions-heading" className="sr-only">Configuration and Actions</h2>
              <RpcConfiguration />
              <SimulateTransaction onTransactionSimulated={handleDataChange} />
            </section>

            <section className="lg:col-span-2 space-y-6 lg:space-y-8" aria-labelledby="data-heading">
              <h2 id="data-heading" className="sr-only">Dashboard and Rewards</h2>
              <Dashboard refreshTrigger={refreshKey} />
              <RewardsClaim onRewardsClaimed={handleDataChange} />
            </section>
          </div>
        )}
      </main>
      <footer className="py-6 text-center text-muted text-sm bg-card border-t border-gray-200 print:hidden">
        <p>&copy; ${new Date().getFullYear()} Coinback RPC MVP. All Rights Reserved (Simulated).</p>
        <p className="text-xs mt-1">This application is for demonstration purposes only.</p>
        {userId && isAuthenticated && <p className="text-xs mt-1">Authenticated User ID (Firebase): {userId}</p>}
      </footer>
    </div>
  );
}

export default App;
