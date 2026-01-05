import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { NextAuthOptions } from "next-auth"
import { PublicKey } from "@solana/web3.js"
import nacl from "tweetnacl"
import bs58 from "bs58"

// Extend NextAuth types for wallet-based auth
declare module "next-auth" {
    interface Session {
        user: {
            id: string
            walletAddress?: string | null
            name?: string | null
            image?: string | null
            username?: string | null
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string
        walletAddress?: string | null
        username?: string | null
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
        // Wallet Authentication (Solana)
        CredentialsProvider({
            id: "wallet",
            name: "Wallet",
            credentials: {
                walletAddress: { label: "Wallet Address", type: "text" },
                signature: { label: "Signature", type: "text" },
                message: { label: "Message", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.walletAddress || !credentials?.signature || !credentials?.message) {
                    console.error("[Wallet Auth] Missing credentials")
                    return null
                }

                try {
                    // Verify the signature
                    const publicKey = new PublicKey(credentials.walletAddress)
                    const messageBytes = new TextEncoder().encode(credentials.message)
                    const signatureBytes = bs58.decode(credentials.signature)
                    
                    const isValid = nacl.sign.detached.verify(
                        messageBytes,
                        signatureBytes,
                        publicKey.toBytes()
                    )

                    if (!isValid) {
                        console.error("[Wallet Auth] Invalid signature")
                        return null
                    }

                    // Upsert user by wallet address
                    let user = await prisma.user.findFirst({
                        where: { walletAddress: credentials.walletAddress }
                    })

                    if (!user) {
                        // Create new user with wallet
                        user = await prisma.user.create({
                            data: {
                                walletAddress: credentials.walletAddress,
                                name: `${credentials.walletAddress.slice(0, 4)}...${credentials.walletAddress.slice(-4)}`,
                                hasCompletedOnboarding: false,
                                calibrationCompleted: false,
                                tier: 'free'
                            }
                        })
                        console.log("[Wallet Auth] Created new user:", user.id)
                    } else {
                        console.log("[Wallet Auth] Found existing user:", user.id)
                    }

                    return {
                        id: user.id,
                        walletAddress: user.walletAddress,
                        name: user.name,
                        image: user.image,
                    }
                } catch (error) {
                    console.error("[Wallet Auth] Error:", error)
                    return null
                }
            }
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            console.log("[Auth] signIn callback:", { userId: user?.id, provider: account?.provider })
            return true
        },
        async redirect({ url, baseUrl }) {
            // Relative URLs - prepend base
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Same origin - allow
            try {
                if (new URL(url).origin === baseUrl) return url
            } catch {
                // Invalid URL, use default
            }
            // Default to dashboard
            return `${baseUrl}/command-center`
        },
        async jwt({ token, user }) {
            // Initial sign in - populate token from user
            if (user) {
                token.id = user.id
                token.walletAddress = (user as any).walletAddress || null
            }

            // Fetch latest user data from DB
            if (token.id) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.id as string },
                        select: {
                            username: true,
                            walletAddress: true,
                            name: true,
                            image: true
                        }
                    })
                    if (dbUser) {
                        token.username = dbUser.username
                        token.walletAddress = dbUser.walletAddress
                        if (dbUser.name) token.name = dbUser.name
                        if (dbUser.image) token.picture = dbUser.image
                    }
                } catch (e) {
                    console.error("[Auth] Failed to fetch user data:", e)
                }
            }

            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.walletAddress = token.walletAddress as string || null
                session.user.username = token.username as string || null
            }
            return session
        }
    },
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET,
}
