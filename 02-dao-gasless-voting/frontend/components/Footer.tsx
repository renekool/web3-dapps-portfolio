import React from 'react';
import { Landmark, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary pt-48 pb-12 px-4 md:px-8">
      <div className="max-w-[800px] mx-auto w-full flex flex-col items-center text-center gap-8">
        {/* Logo & Title */}
        <div className="flex flex-col items-center gap-5">
          <div className="size-14 bg-dark-green rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-dark-green/10">
            <Landmark className="size-7" />
          </div>
          <h2 className="text-dark-green text-3xl font-black font-display tracking-tight">DAO Governance</h2>
        </div>
        
        {/* Description */}
        <p className="text-dark-green/80 text-lg leading-relaxed max-w-3xl px-4">
          Secure, gasless DAO governance via EIP-712 meta-transactions.<br className="hidden sm:block" />
          Propose, vote, and manage the treasury without paying Ethereum fees.
        </p>
        
        {/* Socials */}
        <div className="flex gap-4 pt-2">
          <a className="size-12 rounded-full bg-dark-green text-primary flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-dark-green/10" href="https://www.linkedin.com/in/reneorellana" target="_blank" rel="noopener noreferrer">
            <Linkedin className="size-5" />
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1200px] mx-auto w-full mt-20 pt-8 border-t border-dark-green/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-dark-green/50 uppercase tracking-widest">
        <p>© 2026 DAO GASLESS</p>
        <p>Designed by René 😎</p>
      </div>
    </footer>
  );
}

