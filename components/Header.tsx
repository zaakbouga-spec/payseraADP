import React from 'react';
import { LogoIcon } from './Icons';

const Header = () => (
  <header className="bg-gradient-to-r from-[#1E5C6E] to-[#2C8C8C] p-4 sm:p-6 shadow-md">
    <div className="container mx-auto flex items-center space-x-3">
      <LogoIcon />
      <h1 className="text-3xl font-bold text-white tracking-wide">P-Advisor</h1>
    </div>
  </header>
);

export default Header;
