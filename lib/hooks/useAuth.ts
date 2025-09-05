import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const useAuth = () => {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  const logout = async () => {
    await signOut({ redirect: false })
    router.push('/auth/login')
  }

  const hasRole = (role: string) => {
    if (!session?.user?.role) return false
    return session.user.role === role
  }

  const hasAnyRole = (roles: string[]) => {
    if (!session?.user?.role) return false
    return roles.includes(session.user.role)
  }

  const hasUserType = (userType: string) => {
    if (!session?.user?.userType) return false
    return session.user.userType === userType
  }

  const isVerified = () => {
    return session?.user?.isVerified === true
  }

  const isActive = () => {
    return session?.user?.status === 'ACTIVE'
  }

  return {
    session,
    user: session?.user,
    isAuthenticated,
    isLoading,
    logout,
    hasRole,
    hasAnyRole,
    hasUserType,
    isVerified,
    isActive,
  }
} 