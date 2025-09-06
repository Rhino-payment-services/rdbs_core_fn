"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode } from "react"

interface SessionProviderProps {
  children: ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // Add these options to improve session handling
      refetchInterval={5 * 60} // Refetch session every 5 minutes
      refetchOnWindowFocus={true} // Refetch when window regains focus
      refetchWhenOffline={false} // Don't refetch when offline
      // Add session persistence options
      basePath="/api/auth"
      // Ensure session is available immediately
      session={undefined} // Let NextAuth handle session management
    >
      {children}
    </NextAuthSessionProvider>
  )
}

