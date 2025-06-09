import React from 'react';
import ConnectWallet from './ConnectWallet';
import { Zap } from 'lucide-react';

const Header = () => (
  <header className="glass-header">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div className="flex items-center gap-3">
         <Zap size={32} className="text-primary drop-shadow-glow-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">
          Coinback <span className="font-light opacity-70">RPC</span>
        </h1>
      </div>
      <ConnectWallet />
    </div>
  </header>
);