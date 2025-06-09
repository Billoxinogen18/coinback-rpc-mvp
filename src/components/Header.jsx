import React from 'react';
import ConnectWallet from './ConnectWallet';
import { TrendingUp } from 'lucide-react';

const Header = () => (
  <header className="glassmorphic sticky top-0 z-50 shadow-lg">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
      <div className="flex items-center gap-3">
         <TrendingUp size={36} className="text-primary drop-shadow-[0_0_10px_hsla(var(--color-primary-hsl)/0.8)]" />
        <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Coinback <span className="font-light opacity-80">RPC</span></h1>
      </div>
      <ConnectWallet />
    </div>
  </header>
);

export default Header;