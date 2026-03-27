import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0B0B0B]">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-12rem] top-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[#00FF88]/10 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-[24rem] w-[24rem] rounded-full bg-[#FF6B00]/10 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-[#1f4fff]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
      </div>
      <Header />
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 motion-safe:[animation:fadeUp_420ms_ease-out] sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
};
