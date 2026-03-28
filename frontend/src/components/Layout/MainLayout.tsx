import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="theme-shell relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-60 sm:opacity-70">
        <div className="ambient-orb absolute left-[-8rem] top-[-6rem] h-[18rem] w-[18rem] rounded-full bg-[#8ef7c7]/10 blur-2xl sm:left-[-12rem] sm:top-[-8rem] sm:h-[28rem] sm:w-[28rem] sm:blur-3xl motion-safe:[animation:floatGlow_9s_ease-in-out_infinite]" />
        <div className="ambient-orb absolute right-[-7rem] top-[4rem] hidden h-[16rem] w-[16rem] rounded-full bg-[#ffb5d3]/12 blur-2xl sm:block sm:right-[-10rem] sm:top-[6rem] sm:h-[24rem] sm:w-[24rem] sm:blur-3xl motion-safe:[animation:floatGlow_11s_ease-in-out_infinite]" />
        <div className="ambient-orb absolute bottom-[-10rem] left-1/3 hidden h-[22rem] w-[22rem] rounded-full bg-[#cab8ff]/10 blur-2xl lg:block lg:h-[30rem] lg:w-[30rem] lg:blur-3xl motion-safe:[animation:floatGlow_13s_ease-in-out_infinite]" />
        <div className="ambient-grid absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />
      </div>
      <Header />
      <main className="page-shell noise-overlay relative mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
};
