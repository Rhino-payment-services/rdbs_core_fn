import CredentialsProvider from "next-auth/providers/credentials"
import { NextAuthOptions } from "next-auth"
import axios from "axios"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        console.log("🔐 Attempting login with:", {
          email: credentials.email,
          password: credentials.password ? "***" : "missing"
        })

        try {
          // Call your backend endpoint using Axios
          const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/login`
          console.log("🌐 Calling backend:", backendUrl)
          
          const response = await axios.post(
            backendUrl,
            {
              email: credentials.email,
              password: credentials.password,
              channel: process.env.NEXT_PUBLIC_CHANNEL || 'BACKOFFICE'
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          )

          console.log("✅ Backend response:", response.data)

          const data = response.data
          console.log("📊 Response data structure:", Object.keys(data))
          console.log("📊 User object keys:", data.user ? Object.keys(data.user) : "No user object")
          
          if (data.user && data.accessToken) {
            console.log("✅ User authenticated successfully:", data.user.email)
            
            // Map backend response to NextAuth user object
            const userObject = {
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
              // Add additional fields from your backend
              kycStatus: data.user.kycStatus,
              verificationLevel: data.user.verificationLevel,
              canHaveWallet: data.user.canHaveWallet,
              // Include permissions in session
              permissions: data.user.permissions || [],
            }
            
            console.log("✅ Returning user object:", userObject)
            return userObject
          }
          
          console.log("❌ Missing required fields:")
          console.log("  - user:", !!data.user)
          console.log("  - accessToken:", !!data.accessToken)
          console.log("  - user.id:", data.user?.id)
          console.log("  - user.email:", data.user?.email)
          console.log("❌ Invalid response format:", data)
          return null
        } catch (error: any) {
          if (error.response) {
            // Server responded with error status
            const { status, data } = error.response
            console.error(`❌ Backend error ${status}:`, data)
            
            if (status === 401) {
              console.error("❌ Authentication failed - Invalid credentials")
              console.error("Backend message:", data.message || "Invalid email or password")
            } else if (status === 404) {
              console.error("❌ Endpoint not found - Check backend URL")
            } else if (status >= 500) {
              console.error("❌ Server error - Check backend logs")
            }
          } else if (error.request) {
            // Request made but no response received
            console.error("❌ Network error - No response from backend")
            console.error("Check if backend is running on:", process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
          } else {
            // Something else happened
            console.error("❌ Request setup error:", error.message)
          }
          
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // 1 hour - update session every hour
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
        // Additional fields from your backend
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
        // Additional fields from your backend
        session.user.kycStatus = token.kycStatus as string
        session.user.verificationLevel = token.verificationLevel as string
        session.user.canHaveWallet = token.canHaveWallet as boolean
        ;(session.user as any).permissions = token.permissions as string[]
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      console.log("🔄 Redirect callback:", { url, baseUrl })
      
      if (!url) {
        console.log("🔄 No URL provided, redirecting to dashboard")
        return `${baseUrl}/dashboard`
      }
      
      if (url.startsWith("/")) {
        console.log("🔄 Relative URL, making absolute:", url)
        return `${baseUrl}${url}`
      }
      
      try {
        const urlObj = new URL(url)
        if (urlObj.origin === baseUrl) {
          console.log("🔄 Same origin URL, allowing:", url)
          return url
        }
      } catch (e) {
        console.log("🔄 Invalid URL, redirecting to dashboard")
        return `${baseUrl}/dashboard`
      }
      
      console.log("🔄 Default fallback to dashboard")
      return `${baseUrl}/dashboard`
      
      if (url.includes("/auth/login")) {
        console.log("🔄 Redirecting authenticated user to dashboard")
        return `${baseUrl}/dashboard`
      }
      
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl + "/dashboard"
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
