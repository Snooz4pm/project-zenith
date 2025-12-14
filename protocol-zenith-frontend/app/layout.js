// File: protocol-zenith-frontend/app/layout.js

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                <title>Protocol Zenith - DeFi Oracle</title>
                <meta name="description" content="Real-time DeFi token scoring and ranking oracle" />
            </head>
            {/* Deep dark background with white text globally */}
            <body className="bg-gray-950 text-white min-h-screen antialiased">
                {children}
            </body>
        </html>
    );
}
