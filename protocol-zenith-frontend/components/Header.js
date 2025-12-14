// File: protocol-zenith-frontend/components/Header.js

export default function Header() {
    return (
        <header className="bg-gray-800 p-4 shadow-md">
            <nav className="container mx-auto flex justify-between items-center">
                <div className="text-xl font-extrabold text-indigo-300">ZENITH</div>
                <div className="space-x-4">
                    <a href="#" className="text-gray-300 hover:text-white">Dashboard</a>
                    <a href="#" className="text-gray-300 hover:text-white">API Docs</a>
                </div>
            </nav>
        </header>
    );
}
