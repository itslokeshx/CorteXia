"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { QuickAddBar } from "@/components/quick-add/quick-add-bar";

export function Header() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (theme === "light") {
      html.classList.add("dark");
      setTheme("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      setTheme("light");
      localStorage.setItem("theme", "light");
    }
  };

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    }
  }, []);

  return (
    <header className="hidden lg:flex fixed top-0 right-0 h-14 z-30 items-center justify-end px-6 gap-3 bg-transparent">
      {/* Quick Add Bar - Centered */}
      <div className="flex-1 flex justify-center max-w-xl">
        <QuickAddBar />
      </div>

      {/* Theme Toggle - Clean minimal */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="h-8 w-8 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {theme === "light" ? (
          <Moon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        ) : (
          <Sun className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        )}
      </Button>
    </header>
  );
}
