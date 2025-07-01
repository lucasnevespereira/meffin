import { ModeSwitcher } from "./mode-switcher";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  return (
    <header className="absolute top-0 right-0 flex justify-end items-center p-4 gap-2">
      <LanguageSwitcher />
      <ModeSwitcher />
    </header>
  );
}
