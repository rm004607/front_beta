import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evitar hidration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="h-10 w-10">
        <Sun size={18} className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-10 w-10"
      aria-label="Cambiar tema"
    >
      {theme === 'dark' ? (
        <Sun size={18} className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <Moon size={18} className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
    </Button>
  );
}




