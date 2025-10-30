"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode, useEffect, useRef } from "react"

interface SessionProviderProps {
  children: ReactNode
}

export default function SessionProvider({ children }: SessionProviderProps) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`🔄 SessionProvider rendered ${renderCount.current} times`);
    
    // If rendering too many times, there's a problem
    if (renderCount.current > 10) {
      console.error('⚠️ SessionProvider is re-rendering excessively! Check for state/prop changes in parent components.');
    }
  });

  return (
    <NextAuthSessionProvider
      // Disable automatic session refetching to prevent infinite loops
      refetchInterval={0} // Disable automatic refetch
      refetchOnWindowFocus={false} // Don't refetch on window focus
      refetchWhenOffline={false} // Don't refetch when offline
      basePath="/api/auth"
    >
      {children}
    </NextAuthSessionProvider>
  )
}
