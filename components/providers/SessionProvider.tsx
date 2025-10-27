"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode } from "react"

interface SessionProviderProps {
  children: ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // Disable automatic session refetching to prevent infinite loops
      refetchInterval={0} // Disable automatic refetch (was causing infinite loop)
      refetchOnWindowFocus={false} // Only refetch when explicitly needed
      refetchWhenOffline={false} // Don't refetch when offline
      basePath="/api/auth"
    >
      {children}
    </NextAuthSessionProvider>
  )
}
