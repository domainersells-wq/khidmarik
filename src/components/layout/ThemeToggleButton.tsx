
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleButtonProps {
  className?: string;
}

export const ThemeToggleButton = React.forwardRef<HTMLButtonElement, ThemeToggleButtonProps>(
  ({ className }, ref) => {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return <Button ref={ref} variant="outline" size="icon" disabled className={className} />;
    }

    const currentTheme = theme === 'system' ? resolvedTheme : theme;

    return (
      <Button
        ref={ref}
        variant="outline"
        size="icon"
        onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
        aria-label={currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className={className}
      >
        {currentTheme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>
    );
  }
);

ThemeToggleButton.displayName = 'ThemeToggleButton';
