import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="theme-shell relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="ambient-grid absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:96px_96px] [mask-image:radial-gradient(circle_at_center,black,transparent_82%)]" />
      </div>
      <Header />
      <main className="page-shell relative mx-auto flex w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
};
