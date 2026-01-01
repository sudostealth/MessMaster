"use client"

import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="font-semibold w-12 px-0"
      onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
    >
      {language === 'en' ? 'BN' : 'EN'}
    </Button>
  )
}
