"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { en } from "./dictionaries/en";
import { fi } from "./dictionaries/fi";

type Lang = "en" | "fi";

const dictionaries = {
  en,
  fi,
};

type DictionaryKey = keyof typeof en;

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictionaryKey) => string;
}>({
  lang: "en",
  setLang: () => {},
  t: (key) => en[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("sinet_lang");

    if (saved === "fi" || saved === "en") {
      setLangState(saved);
    }
  }, []);

  function setLang(nextLang: Lang) {
    setLangState(nextLang);
    localStorage.setItem("sinet_lang", nextLang);
  }

  function t(key: DictionaryKey) {
    return dictionaries[lang][key] || en[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}