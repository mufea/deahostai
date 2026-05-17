import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext.jsx';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[44px] min-w-[44px]">
      <div
        role="switch"
        aria-checked={isDark}
        tabIndex={0}
        onClick={toggleTheme}
        onKeyDown={handleKeyDown}
        aria-label={isDark ? 'Toggle light mode' : 'Toggle dark mode'}
        className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background p-[2px] ${
          isDark ? 'bg-primary' : 'bg-slate-300'
        } hover:opacity-90`}
      >
        <span
          className={`pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out ${
            isDark ? 'translate-x-6' : 'translate-x-0'
          }`}
        >
          <span
            className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-300 ${
              isDark ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <Sun className="h-4 w-4 text-amber-500" />
          </span>
          <span
            className={`absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-300 ${
              isDark ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Moon className="h-4 w-4 text-slate-800" />
          </span>
        </span>
      </div>
    </div>
  );
}