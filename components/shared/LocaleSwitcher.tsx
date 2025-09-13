'use client';

import { useCurrentLocale, useChangeLocale } from '@/locales/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

interface LocaleSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
  className?: string;
}

export function LocaleSwitcher({
  variant = 'ghost',
  size = 'sm',
  showText = false,
  className = ""
}: LocaleSwitcherProps) {
  const currentLocale = useCurrentLocale();
  const changeLocale = useChangeLocale();

  const currentLocaleData = locales.find(locale => locale.code === currentLocale);

  const handleLocaleChange = (newLocale: string) => {
    // Prevent unnecessary changes
    if (currentLocale === newLocale) return;

    // The changeLocale hook should handle both state and routing
    changeLocale(newLocale as 'en' | 'fr');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`h-10 px-3 touch-manipulation active:scale-95 transition-transform ${className}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{currentLocaleData?.flag}</span>
            {showText && (
              <span className="hidden sm:inline-block text-sm">
                {currentLocaleData?.name}
              </span>
            )}
            <Languages className="h-4 w-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-36 touch-manipulation"
        side="bottom"
        sideOffset={8}
      >
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
            className={`flex items-center gap-3 cursor-pointer min-h-[44px] px-3 py-2 touch-manipulation active:scale-95 transition-all ${
              locale.code === currentLocale ? 'bg-accent text-accent-foreground' : ''
            }`}
          >
            <span className="text-base">{locale.flag}</span>
            <span className="text-sm font-medium">{locale.name}</span>
            {locale.code === currentLocale && (
              <span className="ml-auto text-xs text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
