import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"
import axios from "axios"

function mapBackendUser(data: any) {
  return {
    id: data.user.id,
    email: data.user.email,
    phone: data.user.phone || null,
    role: data.user.role,
    userType: data.user.userType,
    status: data.user.status,
    isVerified: data.user.isVerified,
    lastLoginAt: data.user.lastLoginAt,
    createdAt: data.user.createdAt,
    updatedAt: data.user.updatedAt,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    kycStatus: data.user.kycStatus,
    verificationLevel: data.user.verificationLevel,
    canHaveWallet: data.user.canHaveWallet,
    permissions: data.user.permissions || [],
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        challengeToken: { label: "Challenge Token", type: "text" },
      },
      async authorize(credentials) {
        const backendBase =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
        const channel = process.env.NEXT_PUBLIC_CHANNEL || "BACKOFFICE"

        try {
          // Step 2: complete staff login with email OTP + challenge token
          if (credentials?.challengeToken && credentials?.otp) {
            const response = await axios.post(
              `${backendBase}/auth/login/verify-otp`,
              {
                challengeToken: credentials.challengeToken,
                otp: credentials.otp,
                channel,
              },
              {
                headers: { "Content-Type": "application/json" },
              },
            )

            const data = response.data
            if (data.user && data.accessToken) {
              return mapBackendUser(data)
            }
            return null
          }

          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Missing credentials")
            return null
          }

          // Step 1: password login (may return requiresOtp for staff)
          const response = await axios.post(
            `${backendBase}/auth/login`,
            {
              email: credentials.email,
              password: credentials.password,
              channel,
            },
            {
              headers: { "Content-Type": "application/json" },
            },
          )

          const data = response.data

          if (data?.requiresOtp && data?.challengeToken) {
            // Staff OTP challenge must be completed via verify-otp; do not create a session yet.
            console.log("🔐 Staff login requires email OTP")
            return null
          }

          if (data.user && data.accessToken) {
            return mapBackendUser(data)
          }

          return null
        } catch (error: any) {
          if (error.response) {
            const { status, data } = error.response
            console.error(`❌ Backend error ${status}:`, data)
          } else if (error.request) {
            console.error("❌ Network error - No response from backend")
          } else {
            console.error("❌ Request setup error:", error.message)
          }

          return null
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.phone = user.phone
        token.role = user.role
        token.userType = user.userType
        token.status = user.status
        token.isVerified = user.isVerified
        token.lastLoginAt = user.lastLoginAt
        token.createdAt = user.createdAt
        token.updatedAt = user.updatedAt
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.kycStatus = user.kycStatus
        token.verificationLevel = user.verificationLevel
        token.canHaveWallet = user.canHaveWallet
        token.permissions = (user as any).permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.phone = token.phone as string | null
        session.user.role = token.role as string
        session.user.userType = token.userType as string
        session.user.status = token.status as string
        session.user.isVerified = token.isVerified as boolean
        session.user.lastLoginAt = token.lastLoginAt as string
        session.user.createdAt = token.createdAt as string
        session.user.updatedAt = token.updatedAt as string
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.user.kycStatus = token.kycStatus as string
        session.user.verificationLevel = token.verificationLevel as string
        session.user.canHaveWallet = token.canHaveWallet as boolean
        ;(session.user as any).permissions = token.permissions
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
