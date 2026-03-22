"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  locales,
  switchLocaleInPathname,
  type AppLocale,
} from "@/features/i18n/config";
import { getClientDictionary, getClientLocale } from "@/features/i18n/client";

type Props = {
  variant?: "ghost" | "outline" | "solid";
  className?: string;
};

const localeLabels: Record<AppLocale, string> = {
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  jp: "日本語",
  pt: "Português",
  sc: "简体中文",
  tc: "繁體中文",
};

export default function LanguageSwitcher({
  variant = "ghost",
  className = "",
}: Props) {
  const pathname = usePathname() ?? "/en";
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = getClientLocale(pathname);
  const dictionary = getClientDictionary(pathname);

  const buttonClassName =
    variant === "outline"
      ? "border border-border bg-card/90 text-foreground hover:bg-muted"
      : variant === "solid"
        ? "bg-white/10 text-[#f7f2e8] hover:bg-white/15 border border-white/15"
        : "text-muted-foreground hover:bg-muted hover:text-foreground";

  function handleChange(nextLocale: string) {
    const targetLocale = nextLocale as AppLocale;
    const nextPath = switchLocaleInPathname(pathname, targetLocale);
    const query = searchParams.toString();
    router.replace(query ? `${nextPath}?${query}` : nextPath);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`gap-2 rounded-lg ${buttonClassName} ${className}`.trim()}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{locale.toUpperCase()}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{dictionary.common.language}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={locale} onValueChange={handleChange}>
            {locales.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {localeLabels[option]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
