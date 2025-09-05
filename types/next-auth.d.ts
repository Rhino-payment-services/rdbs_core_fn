import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    phone: string | null
    role: string
    userType: string
    status: string
    isVerified: boolean
    lastLoginAt: string
    createdAt: string
    updatedAt: string
    accessToken: string
    refreshToken: string
    // Additional fields from your backend
    kycStatus: string
    verificationLevel: string
    canHaveWallet: boolean
  }

  interface Session {
    user: {
      id: string
      email: string
      phone: string | null
      role: string
      userType: string
      status: string
      isVerified: boolean
      lastLoginAt: string
      createdAt: string
      updatedAt: string
      // Additional fields from your backend
      kycStatus: string
      verificationLevel: string
      canHaveWallet: boolean
    }
    accessToken: string
    refreshToken: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    phone: string | null
    role: string
    userType: string
    status: string
    isVerified: boolean
    lastLoginAt: string
    createdAt: string
    updatedAt: string
    accessToken: string
    refreshToken: string
    // Additional fields from your backend
    kycStatus: string
    verificationLevel: string
    canHaveWallet: boolean
  }
} 