"use client"

import Link from 'next/link'
import styles from './footer.module.css'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'


export function Footer() {
  const { t } = useLanguage()
  
  return (
    <footer className={styles.footer}>
      <div className={cn("container", styles.inner)}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <p className={styles.text}>
                &copy; {new Date().getFullYear()} {t("app.name")}. All rights reserved.
                </p>
                <div className={styles.links}>
                <Link href="#" className={styles.link}>
                    Privacy
                </Link>
                <Link href="#" className={styles.link}>
                    Terms
                </Link>
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-sm transition-all hover:bg-secondary/50 hover:border-white/10 group">
                <span className="text-xs font-medium uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity">Developed by</span>
                <Link 
                    href="https://github.com/sudostealth" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary transition-all duration-300 transform group-hover:scale-105 inline-block"
                >
                    MD.SAZIB
                </Link>
            </div>
        </div>
      </div>
    </footer>
  )
}
