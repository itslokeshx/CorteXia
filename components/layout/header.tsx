'use client';

import { Brain, Settings, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (theme === 'light') {
      html.classList.add('dark');
      setTheme('dark');
    } else {
      html.classList.remove('dark');
      setTheme('light');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-40 flex items-center justify-between px-8">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-state-ontrack to-state-momentum flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <span className="text-lg font-semibold text-text-primary hidden sm:inline group-hover:text-state-ontrack transition-colors">
          CorteXia
        </span>
      </Link>

      {/* Quick Add Bar */}
      <div className="flex-1 mx-12 max-w-2xl">
        <Input
          placeholder="Type anything... (spent $45, studied 2h, went to gym)"
          className="w-full bg-bg-secondary border-border text-text-primary placeholder:text-text-tertiary"
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="hover:bg-bg-secondary"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-bg-secondary"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
