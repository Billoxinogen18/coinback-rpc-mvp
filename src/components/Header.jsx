import React from 'react';
import ConnectWallet from './ConnectWallet';
import { Zap } from 'lucide-react';

const Header = () => (
  <header className="sticky top-0 z-50 glass-panel border-b border-glass">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Zap size={32} className="text-primary drop-shadow-glow-primary animate-glow-pulse" />
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150 animate-pulse"></div>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
            Coinback{' '}
            <span className="font-light text-textSecondary opacity-80">RPC</span>
          </h1>
          <div className="hidden sm:block">
            <div className="h-0.5 w-16 bg-gradient-to-r from-primary via-accent to-transparent rounded-full mt-1"></div>
          </div>
        </div>
      </div>
      <ConnectWallet />
    </div>
  </header>
);

export default Header;