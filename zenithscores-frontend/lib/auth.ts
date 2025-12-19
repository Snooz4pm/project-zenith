import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import { NextAuthOptions } from "next-auth"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma) as any, // Type assertion for v4 compatibility
    session: {
        strategy: "jwt",
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
                    where: {
                        email: credentials.email
                    }
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
            }
        })
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                return true
            }
            return true
        },
        async session({ session, token }) {
            if (token && session.user) {
                // session.user.id = token.sub
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        }
    },
    debug: true,
    secret: process.env.NEXTAUTH_SECRET,
    logger: {
        error(code, metadata) {
            console.error('NEXTAUTH ERROR:', code, JSON.stringify(metadata, null, 2))
        },
        warn(code) {
            console.warn('NEXTAUTH WARN:', code)
        },
        debug(code, metadata) {
            console.log('NEXTAUTH DEBUG:', code, metadata)
        }
    }
}

