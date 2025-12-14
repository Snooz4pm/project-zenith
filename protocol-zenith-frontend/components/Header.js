// File: protocol-zenith-frontend/components/Header.js

export default function Header() {
    return (
        <header className="bg-gray-900 border-b border-gray-800 p-4 shadow-lg">
            <nav className="container mx-auto flex justify-between items-center">
                <div className="text-2xl font-extrabold text-green-400">ZENITH</div>
                <div className="space-x-6">
                    <a href="#" className="text-gray-300 hover:text-green-400 transition duration-200">Dashboard</a>
                    <a href="#" className="text-gray-300 hover:text-green-400 transition duration-200">API Docs</a>
                </div>
            </nav>
        </header>
    );
}
