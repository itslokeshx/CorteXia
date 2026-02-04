'use client';

import { Header } from './header';
import { Sidebar } from './sidebar';
import { ReactNode } from 'react';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="ml-60 mt-16 p-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
