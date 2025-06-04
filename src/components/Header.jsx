import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ConnectWallet from './ConnectWallet';
import { UserCircle, Database, ShieldCheck, ShieldOff, TrendingUp } from 'lucide-react';

const Header = () => {
  const { userId, loadingAuth, isAuthenticated, userProfile, mEvProtectionActive } = useAuth();

  return (
    <header className="glassmorphic sticky top-0 z-50 shadow-glass border-t-0 border-x-0 rounded-t-none">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          <div className="flex items-center">
             <TrendingUp size={40} className="mr-3 text-primary drop-shadow-md" />
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
              Coinback <span className="font-light text-primaryDark opacity-90">RPC</span>
            </h1>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {loadingAuth ? (
              <span className="text-sm text-textSecondary animate-pulse">Authenticating...</span>
            ) : isAuthenticated && userId ? (
              <div className="flex items-center flex-wrap justify-end gap-2 sm:gap-3">
                <div className={`flex items-center space-x-1.5 text-xs sm:text-sm px-3 py-2 rounded-neo-sm border ${mEvProtectionActive ? 'bg-greenHighlight/10 text-greenHighlight border-greenHighlight/30 shadow-neo-outset-xs' : 'bg-redHighlight/10 text-redHighlight border-redHighlight/30 shadow-neo-outset-xs'}`} title={mEvProtectionActive ? "MEV Protection Active" : "MEV Protection Inactive"}>
                  {mEvProtectionActive ? <ShieldCheck size={18} /> : <ShieldOff size={18} />}
                  <span className="hidden md:inline">{mEvProtectionActive ? "Protected" : "Unprotected"}</span>
                </div>
                {userProfile && userProfile.cbkBalance !== undefined && (
                  <div className="flex items-center space-x-1.5 text-xs sm:text-sm text-primary px-3 py-2 rounded-neo-sm bg-surface/50 border border-primary/30 shadow-neo-outset-xs" title={`CBK Balance: ${userProfile.cbkBalance.toLocaleString()}`}>
                    <Database size={18} className="flex-shrink-0"/>
                    <span className="hidden md:inline">CBK: </span>
                    <span>{userProfile.cbkBalance.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1.5 text-xs sm:text-sm text-textPrimary px-3 py-2 rounded-neo-sm bg-surface/50 border border-textSecondary/30 shadow-neo-outset-xs" title={`User ID: ${userId.substring(0, 6)}...`}>
                  <UserCircle size={20} className="flex-shrink-0"/>
                  <span className="hidden md:inline">User: </span>
                  <span>{userId.substring(0, 6)}...</span>
                </div>
                <ConnectWallet />
              </div>
            ) : (
              <ConnectWallet />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;