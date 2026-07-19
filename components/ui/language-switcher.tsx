'use client';

import { HugeiconsIcon } from "@hugeicons/react";
import { LanguageCircleIcon } from "@hugeicons/core-free-icons";
import { useCurrentLocale, useChangeLocale } from '@/locales/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
const languages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

export function LanguageSwitcher() {
  const locale = useCurrentLocale();
  const changeLocale = useChangeLocale();

  const switchLanguage = (newLocale: string) => {
    // Prevent unnecessary changes
    if (locale === newLocale) return;
    
    changeLocale(newLocale as 'en' | 'fr');
  };

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-10 px-3 touch-manipulation active:scale-95 transition-transform"
        >
          <HugeiconsIcon icon={LanguageCircleIcon} className="h-4 w-4 mr-2" />
          <span className="text-sm">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="min-w-[140px] touch-manipulation"
        side="bottom"
        sideOffset={8}
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className={`cursor-pointer min-h-[44px] px-3 py-2 touch-manipulation active:scale-95 transition-all ${
              language.code === locale ? 'bg-accent text-accent-foreground' : ''
            }`}
          >
            <span className="mr-3 text-base">{language.flag}</span>
            <span className="text-sm font-medium">{language.name}</span>
            {language.code === locale && (
              <span className="ml-auto text-xs text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
