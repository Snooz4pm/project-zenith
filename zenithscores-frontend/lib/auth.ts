import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextAuthOptions } from "next-auth"

// Extend NextAuth types for calibrationCompleted and tier
declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            name?: string | null
            image?: string | null
            calibrationCompleted: boolean
            tier: string
            isPremium: boolean
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string
        calibrationCompleted?: boolean
        tier?: string
        isPremium?: boolean
    }
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/auth/login',
        error: '/auth/error',
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true, // Allow linking accounts with same email
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email }
                    })

                    if (!user || !user.password_hash) {
                        return null
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password_hash
                    )

                    if (!isPasswordValid) {
                        return null
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    }
                } catch (error) {
                    console.error("Credentials auth error:", error)
                    return null
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            // Always allow sign in - let the adapter handle user creation
            console.log("[Auth] signIn callback:", { userId: user?.id, provider: account?.provider })
            return true
        },
        async redirect({ url, baseUrl }) {
            console.log("[Auth] redirect callback:", { url, baseUrl })
            // Relative URLs - prepend base
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Same origin - allow
            try {
                if (new URL(url).origin === baseUrl) return url
            } catch {
                // Invalid URL, use default
            }
            // Default to command-center
            return `${baseUrl}/command-center`
        },
        async jwt({ token, user, account, trigger }) {
            console.log("[Auth] jwt callback:", { hasUser: !!user, trigger, email: token.email })

            // Initial sign in
            if (user) {
                token.id = user.id
                token.calibrationCompleted = false // Default to false, will be checked by middleware
            }

            // If we have an ID, try to get calibration status and tier from DB
            // But wrap in try-catch to not break auth if DB fails
            if (token.id) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: {
                            calibrationCompleted: true,
                            tier: true,
                            subscriptionStatus: true,
                            subscriptionEnd: true,
                            name: true,
                            email: true,
                            image: true
                        }
                    })
                    if (dbUser) {
                        token.calibrationCompleted = dbUser.calibrationCompleted ?? false
                        token.tier = dbUser.tier || 'free'

                        // Calculate isPremium based on tier and subscription status
                        const isSubscriptionActive =
                            dbUser.tier === 'premium' &&
                            dbUser.subscriptionStatus === 'active' &&
                            (!dbUser.subscriptionEnd || new Date(dbUser.subscriptionEnd) > new Date())
                        token.isPremium = isSubscriptionActive

                        if (dbUser.name) token.name = dbUser.name
                        if (dbUser.email) token.email = dbUser.email
                        if (dbUser.image) token.picture = dbUser.image
                    }
                } catch (e) {
                    console.error("[Auth] Failed to fetch user data:", e)
                    // Don't fail auth, just use defaults
                    token.calibrationCompleted = false
                    token.tier = 'free'
                    token.isPremium = false
                }
            }

            // If no ID but have email (OAuth first time), try to get by email
            if (!token.id && token.email) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: token.email as string },
                        select: {
                            id: true,
                            calibrationCompleted: true,
                            tier: true,
                            subscriptionStatus: true,
                            subscriptionEnd: true
                        }
                    })
                    if (dbUser) {
                        token.id = dbUser.id
                        token.calibrationCompleted = dbUser.calibrationCompleted ?? false
                        token.tier = dbUser.tier || 'free'

                        const isSubscriptionActive =
                            dbUser.tier === 'premium' &&
                            dbUser.subscriptionStatus === 'active' &&
                            (!dbUser.subscriptionEnd || new Date(dbUser.subscriptionEnd) > new Date())
                        token.isPremium = isSubscriptionActive
                    }
                } catch (e) {
                    console.error("[Auth] Failed to fetch user by email:", e)
                    // Don't fail auth
                }
            }

            return token
        },
        async session({ session, token }) {
            console.log("[Auth] session callback:", { tokenId: token.id, calibrated: token.calibrationCompleted, tier: token.tier })
            if (session.user) {
                session.user.id = token.id as string
                session.user.calibrationCompleted = token.calibrationCompleted ?? false
                session.user.tier = token.tier || 'free'
                session.user.isPremium = token.isPremium ?? false
            }
            return session
        }
    },
    events: {
        async createUser({ user }) {
            console.log("[Auth] createUser event:", { userId: user.id })
            // New user created via OAuth - ensure calibrationCompleted is false
            try {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { calibrationCompleted: false }
                })
            } catch (e) {
                console.error("[Auth] Failed to set calibrationCompleted for new user:", e)
            }
        }
    },
    debug: true, // Enable debug logging to see what's happening
    secret: process.env.NEXTAUTH_SECRET,
}
