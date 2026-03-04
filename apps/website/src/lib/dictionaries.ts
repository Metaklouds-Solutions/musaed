import type en from "@/dictionaries/en.json";

export type Dictionary = typeof en;

export async function getDictionary(locale: "ar" | "en"): Promise<Dictionary> {
  const dictionary = await import(`@/dictionaries/${locale}.json`);
  return dictionary.default;
}
