import type { AppLocale } from "@/features/i18n/config";
import { defaultLocale } from "@/features/i18n/config";
import de from "@/language/de.json";
import en from "@/language/en.json";
import es from "@/language/es.json";
import fr from "@/language/fr.json";
import jp from "@/language/jp.json";
import pt from "@/language/pt.json";
import sc from "@/language/sc.json";
import tc from "@/language/tc.json";

const dictionaries = {
  de,
  en,
  es,
  fr,
  jp,
  pt,
  sc,
  tc,
} as const;

export type AppDictionary = typeof en;

export function getDictionary(locale: AppLocale): AppDictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
