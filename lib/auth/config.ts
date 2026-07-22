import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"
import axios from "axios"

function mapBackendUser(data: {
  user: any
  accessToken: string
  refreshToken?: string
}) {
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
        // Preferred: complete session from already-verified backend tokens
        accessToken: { label: "Access Token", type: "text" },
        refreshToken: { label: "Refresh Token", type: "text" },
        user: { label: "User JSON", type: "text" },
        // Legacy / OTP verify path (server-side backend call)
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
          // Preferred path: tokens already issued by /auth/login or /auth/login/verify-otp
          if (credentials?.accessToken && credentials?.user) {
            try {
              const user = JSON.parse(credentials.user)
              if (user?.id && user?.email) {
                return mapBackendUser({
                  user,
                  accessToken: credentials.accessToken,
                  refreshToken: credentials.refreshToken,
                }) as any
              }
            } catch (parseError) {
              console.error("❌ Failed to parse user payload for session", parseError)
              return null
            }
          }

          // OTP verify via backend (fallback if client didn't pass tokens)
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
              return mapBackendUser(data) as any
            }
            return null
          }

          // Password login is handled by the login page directly (OTP challenge).
          // Do not create a session from password alone for BACKOFFICE.
          if (credentials?.email && credentials?.password) {
            console.log(
              "🔐 Password-only NextAuth login is disabled for staff OTP flow",
            )
            return null
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
