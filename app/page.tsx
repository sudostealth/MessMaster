"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import styles from "./page.module.css"
import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    const getUser = async () => {
       const { data: { user } } = await supabase.auth.getUser()
       setUser(user)
    }
    getUser()
  }, [])

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div>
          <h1 className={styles.title}>{t("app.name")}</h1>
          <p className={styles.description}>
            {t("welcome")}
          </p>
        </div>
        
        <div className={styles.actions}>
          {user ? (
            <Link href="/dashboard">
              <Button size="lg" className="w-[200px]">{t("dashboard")}</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button size="lg">{t("login")}</Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg">{t("signup")}</Button>
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
