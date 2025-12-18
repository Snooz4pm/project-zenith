import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://project-zenith-zexd.vercel.app';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google" && profile) {
                try {
                    // Sync user to backend
                    const response = await fetch(`${API_BASE_URL}/api/v1/auth/user`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            google_id: profile.sub,
                            email: user.email,
                            name: user.name,
                            profile_picture: user.image,
                        }),
                    });

                    if (!response.ok) {
                        console.error('Failed to sync user to backend');
                        // Don't block sign-in on backend failure
                    }
                } catch (error) {
                    console.error('Error syncing user:', error);
                    // Don't block sign-in on backend failure
                }
            }
            return true;
        },
        async jwt({ token, user, account, profile }) {
            // Add user info to token on initial sign in
            if (account && profile) {
                token.googleId = profile.sub;
            }
            return token;
        },
        async session({ session, token }) {
            // Add custom properties to session
            if (session.user) {
                (session.user as any).googleId = token.googleId;
            }
            return session;
        },
    },
    /*
    pages: {
        signIn: '/auth/signin', // Custom sign-in page (optional, can use default)
    },
    */
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
