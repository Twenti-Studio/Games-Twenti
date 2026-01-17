import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Initialize from localStorage or system preference
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
    }
    return false;
  });

  useEffect(() => {
    // Apply theme on mount and when isDark changes
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark((prev) => {
      const nextIsDark = !prev;
      localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
      return nextIsDark;
    });
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="relative p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
      aria-label="Toggle dark mode"
    >
      <Sun 
        size={20} 
        className={`absolute inset-0 m-auto transition-all duration-300 ${
          isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
        }`} 
      />
      <Moon 
        size={20} 
        className={`transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
        }`} 
      />
    </button>
  );
}

export default DarkModeToggle;
