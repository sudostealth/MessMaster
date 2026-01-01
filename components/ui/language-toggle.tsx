"use client"

import * as React from "react"
import { Languages } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <Button
      variant="ghost"
      onClick={() => setLanguage(language === "en" ? "bn" : "en")}
      aria-label="Toggle language"
      className="w-12 font-bold"
    >
       {language === 'en' ? 'BN' : 'EN'}
    </Button>
  )
}
