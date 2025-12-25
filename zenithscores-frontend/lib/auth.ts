import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextAuthOptions } from "next-auth"

// Extend NextAuth types for calibrationCompleted
declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            name?: string | null
            image?: string | null
            calibrationCompleted: boolean
        }
    }
    interface User {
        calibrationCompleted?: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        calibrationCompleted: boolean
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
                    calibrationCompleted: user.calibrationCompleted,
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account }) {
            // For Google OAuth, update last_login
            if (account?.provider === "google" && user.email) {
                try {
                    await prisma.user.update({
                        where: { email: user.email },
                        data: { last_login: new Date() }
                    })
                } catch {
                    // User might not exist yet, PrismaAdapter will create
                }
            }
            return true
        },
        async redirect({ url, baseUrl }) {
            // Relative URLs - prepend base
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Same origin - allow
            if (new URL(url).origin === baseUrl) return url
            // Default to command-center (not dashboard)
            return `${baseUrl}/command-center`
        },
        async jwt({ token, user, trigger }) {
            // Initial sign in - attach user data
            if (user) {
                token.id = user.id
                token.calibrationCompleted = user.calibrationCompleted ?? false
            }

            // Refresh calibration status on session update
            if (trigger === "update" && token.id) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string },
                    select: { calibrationCompleted: true }
                })
                if (dbUser) {
                    token.calibrationCompleted = dbUser.calibrationCompleted
                }
            }

            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.calibrationCompleted = token.calibrationCompleted as boolean
            }
            return session
        }
    },
    events: {
        async createUser({ user }) {
            // New user created via OAuth - mark as uncalibrated
            await prisma.user.update({
                where: { id: user.id },
                data: { calibrationCompleted: false }
            })
        }
    },
    debug: process.env.NODE_ENV === "development",
    secret: process.env.NEXTAUTH_SECRET,
}
