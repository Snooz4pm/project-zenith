/**
 * Root Layout
 * Main layout with sidebar navigation
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import CategorySidebar from '@/components/CategorySidebar';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'News Signal - Autonomous News Intelligence',
    description: 'AI-powered news aggregation and analysis platform',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="flex min-h-screen bg-gray-50">
                    <CategorySidebar />
                    <main className="flex-1 overflow-x-hidden">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
