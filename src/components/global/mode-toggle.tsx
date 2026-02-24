'use client';
import { useTheme } from 'next-themes';
import React from 'react';
import { Button } from '../ui/button';
import { Moon, Sun } from 'lucide-react';

const ModeToggle = () => {
  const { setTheme, theme } = useTheme();
  return (
    <Button
      variant={'outline'}
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative"
    >
      <Sun
        className="h-[1.2rem] 
      w-[1.2rem]
       rotate-0 
       scale-100 
       transition-all 
       dark:-rotate-90 
       dark:scale-0
       text-foreground"
      />
      <Moon
        className="absolute
       h-[1.2rem] 
       w-[1.2rem] 
       rotate-90 
       scale-0 
       transition-all
       dark:rotate-0 
       dark:scale-100
       text-foreground
       top-1/2
       left-1/2
       -translate-x-1/2
       -translate-y-1/2"
      />
    </Button>
  );
};

export default ModeToggle;
