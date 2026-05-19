"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface ThemeToggleProps {
  isSidebarCollapsed: boolean;
}

export function ThemeToggle({ isSidebarCollapsed }: ThemeToggleProps) {

  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);


  if (!mounted) {
    return (
      <div 
        className={`h-10 w-full rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse`}
      />
    );
  }


  if (isSidebarCollapsed) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 w-10 rounded-full bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setTheme("light")}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
            theme === "light"
              ? "bg-white text-amber-500 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
          }`}
          title="Light Mode">
          <Sun size={16} />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
            theme === "dark"
              ? "bg-slate-700 text-blue-400 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-300"
          }`}
          title="Dark Mode">
          <Moon size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-10 w-full items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700" suppressHydrationWarning>

      <button
        onClick={() => setTheme("light")}
        className={`flex flex-1 items-center justify-center gap-2 h-8 rounded-md text-sm font-semibold transition-all duration-200 ${
          theme === "light"
            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
            : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}>
        <Sun size={16} className={theme === "light" ? "text-amber-500" : ""} />
        <span>Light</span>
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`flex flex-1 items-center justify-center gap-2 h-8 rounded-md text-sm font-semibold transition-all duration-200 ${
          theme === "dark"
            ? "bg-slate-700 text-white shadow-sm"
            : "text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}>
        <Moon size={16} className={theme === "dark" ? "text-blue-400" : ""} />
        <span>Dark</span>
      </button>
    </div>
  );
}
