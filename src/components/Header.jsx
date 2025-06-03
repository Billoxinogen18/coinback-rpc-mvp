import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ConnectWallet from './ConnectWallet'; 
import AppLogo from '../assets/logo.svg'; 
import { UserCircle } from 'lucide-react'; 

const Header = () => {
  const { userId, loadingAuth, isAuthenticated } = useAuth();

  return (
    <header className="bg-card shadow-subtle sticky top-0 z-50 print:hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <img 
              src={AppLogo} 
              alt="Coinback MVP Logo" 
              className="h-8 w-auto mr-3" 
              onError={(e) => { e.target.style.display='none'; }}
            />
            <h1 className="text-xl sm:text-2xl font-semibold text-primary-dark">
              Coinback <span className="font-light text-muted">RPC MVP</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {loadingAuth ? (
              <span className="text-sm text-muted animate-pulse">Authenticating...</span>
            ) : isAuthenticated && userId ? ( 
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-primary-dark p-2 rounded-lg bg-primary-light/10 border border-primary-light/30">
                  <UserCircle size={20} className="text-primary"/>
                  <span title={`User ID: ${userId}`}>UID: {userId.substring(0, 6)}...{userId.substring(userId.length - 4)}</span>
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
