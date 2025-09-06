'use client';

import { useRouter, usePathname } from 'next/navigation';
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
  const router = useRouter();
  const pathname = usePathname();

  const currentLocaleData = locales.find(locale => locale.code === currentLocale);

  const handleLocaleChange = (newLocale: string) => {
    changeLocale(newLocale as 'en' | 'fr');
    
    // Update URL to reflect the new locale
    const currentPath = pathname.split('/').slice(2).join('/'); // Remove current locale from path
    const newPath = `/${newLocale}${currentPath ? `/${currentPath}` : ''}`;
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={`h-9 px-3 ${className}`}
        >
          <div className="flex items-center gap-2">
            {currentLocaleData?.flag}
            {showText && (
              <span className="hidden sm:inline-block">
                {currentLocaleData?.name}
              </span>
            )}
            <Languages className="h-4 w-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale.code}
            onClick={() => handleLocaleChange(locale.code)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span>{locale.flag}</span>
            <span>{locale.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}