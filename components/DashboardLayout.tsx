'use client';

import { ReactNode, useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ChevronRight,
    ChevronDown,
    Search,
    Menu,
    X
} from 'lucide-react';

/**
 * DashboardLayout - 2026 Trading App Layout System
 * Inspired by reactbits.dev layout patterns
 * 
 * Features:
 * - Persistent sidebar with categorized navigation
 * - Global header with search and actions
 * - Smooth page transitions
 * - Responsive mobile drawer
 * - Active state indicators
 */

// Context for sidebar state
interface SidebarContextType {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
    isOpen: true,
    setIsOpen: () => { },
    isMobile: false
});

export const useSidebar = () => useContext(SidebarContext);

// Nav item types
interface NavItem {
    label: string;
    href?: string;
    icon?: ReactNode;
    children?: NavItem[];
    badge?: string;
}

interface NavCategory {
    title: string;
    items: NavItem[];
}

// Sidebar navigation component
interface SidebarNavProps {
    categories: NavCategory[];
}

function SidebarNav({ categories }: SidebarNavProps) {
    const pathname = usePathname();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    const toggleExpanded = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    const isActive = (href?: string) => href && pathname === href;
    const isChildActive = (items?: NavItem[]) =>
        items?.some(item => item.href === pathname);

    return (
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
            {categories.map((category) => (
                <div key={category.title}>
                    <h3 className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {category.title}
                    </h3>
                    <ul className="space-y-1">
                        {category.items.map((item) => (
                            <li key={item.label}>
                                {item.children ? (
                                    // Expandable item
                                    <div>
                                        <button
                                            onClick={() => toggleExpanded(item.label)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isChildActive(item.children)
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                }`}
                                        >
                                            {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
                                            <span className="flex-1 text-left">{item.label}</span>
                                            <motion.div
                                                animate={{ rotate: expandedItems.includes(item.label) ? 180 : 0 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <ChevronDown size={14} className="text-gray-500" />
                                            </motion.div>
                                        </button>
                                        <AnimatePresence initial={false}>
                                            {expandedItems.includes(item.label) && (
                                                <motion.ul
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden pl-8 mt-1 space-y-1"
                                                >
                                                    {item.children.map((child) => (
                                                        <li key={child.label}>
                                                            <Link
                                                                href={child.href || '#'}
                                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isActive(child.href)
                                                                        ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 -ml-[2px] pl-[14px]'
                                                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                                                    }`}
                                                            >
                                                                {child.label}
                                                                {child.badge && (
                                                                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                                                                        {child.badge}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </motion.ul>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    // Single item
                                    <Link
                                        href={item.href || '#'}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(item.href)
                                                ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400 -ml-[2px] pl-[14px]'
                                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {item.icon && <span className="w-5 h-5 flex-shrink-0">{item.icon}</span>}
                                        <span className="flex-1">{item.label}</span>
                                        {item.badge && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
}

// Sidebar component
interface SidebarProps {
    logo?: ReactNode;
    categories: NavCategory[];
    footer?: ReactNode;
}

function Sidebar({ logo, categories, footer }: SidebarProps) {
    const { isOpen, setIsOpen, isMobile } = useSidebar();

    if (isMobile) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        />
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed left-0 top-0 h-full w-[280px] bg-[#0a0a12] border-r border-white/5 z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
                                {logo}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <SidebarNav categories={categories} />

                            {footer && (
                                <div className="p-4 border-t border-white/5">
                                    {footer}
                                </div>
                            )}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        );
    }

    return (
        <aside className="hidden lg:flex w-[260px] flex-shrink-0 flex-col bg-[#0a0a12] border-r border-white/5 h-screen sticky top-0">
            {/* Logo */}
            <div className="px-4 py-5 border-b border-white/5">
                {logo}
            </div>

            <SidebarNav categories={categories} />

            {footer && (
                <div className="p-4 border-t border-white/5 mt-auto">
                    {footer}
                </div>
            )}
        </aside>
    );
}

// Header component
interface HeaderProps {
    title?: string;
    subtitle?: string;
    actions?: ReactNode;
    showSearch?: boolean;
    searchPlaceholder?: string;
    onSearch?: (query: string) => void;
}

function Header({
    title,
    subtitle,
    actions,
    showSearch = true,
    searchPlaceholder = 'Search assets...',
    onSearch
}: HeaderProps) {
    const { setIsOpen, isMobile } = useSidebar();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(searchQuery);
    };

    return (
        <header className="sticky top-0 z-30 bg-[#0a0a12]/80 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center gap-4 px-4 lg:px-6 py-4">
                {/* Mobile menu button */}
                {isMobile && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
                    >
                        <Menu size={20} />
                    </button>
                )}

                {/* Title section */}
                <div className="flex-1 min-w-0">
                    {title && (
                        <h1 className="text-xl font-bold text-white truncate">{title}</h1>
                    )}
                    {subtitle && (
                        <p className="text-sm text-gray-500 truncate">{subtitle}</p>
                    )}
                </div>

                {/* Search */}
                {showSearch && (
                    <form onSubmit={handleSearch} className="hidden md:flex items-center">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                            />
                        </div>
                    </form>
                )}

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>
        </header>
    );
}

// Page content wrapper with transitions
interface PageContentProps {
    children: ReactNode;
    className?: string;
}

function PageContent({ children, className = '' }: PageContentProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.main
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`flex-1 overflow-auto ${className}`}
            >
                {children}
            </motion.main>
        </AnimatePresence>
    );
}

// Breadcrumbs component
interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            {items.map((item, index) => (
                <span key={item.label} className="flex items-center gap-1">
                    {index > 0 && <ChevronRight size={14} />}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="hover:text-white transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-white">{item.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}

// Tabbed content component
interface Tab {
    id: string;
    label: string;
    icon?: ReactNode;
    content: ReactNode;
}

interface TabbedContentProps {
    tabs: Tab[];
    defaultTab?: string;
    className?: string;
}

export function TabbedContent({ tabs, defaultTab, className = '' }: TabbedContentProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    return (
        <div className={className}>
            {/* Tab buttons */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? 'text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="tab-indicator"
                                className="absolute inset-0 bg-white/10 rounded-lg"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {tab.icon}
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {tabs.find(tab => tab.id === activeTab)?.content}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Asset card grid component
interface AssetCardGridProps {
    children: ReactNode;
    columns?: 2 | 3 | 4;
    className?: string;
}

export function AssetCardGrid({ children, columns = 3, className = '' }: AssetCardGridProps) {
    const colClasses = {
        2: 'sm:grid-cols-2',
        3: 'sm:grid-cols-2 lg:grid-cols-3',
        4: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    };

    return (
        <div className={`grid grid-cols-1 ${colClasses[columns]} gap-4 ${className}`}>
            {children}
        </div>
    );
}

// Main Dashboard Layout component
interface DashboardLayoutProps {
    children: ReactNode;
    logo?: ReactNode;
    categories: NavCategory[];
    sidebarFooter?: ReactNode;
    headerTitle?: string;
    headerSubtitle?: string;
    headerActions?: ReactNode;
    showSearch?: boolean;
    onSearch?: (query: string) => void;
}

export function DashboardLayout({
    children,
    logo,
    categories,
    sidebarFooter,
    headerTitle,
    headerSubtitle,
    headerActions,
    showSearch = true,
    onSearch
}: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Handle responsive
    if (typeof window !== 'undefined') {
        // This will be hydrated on client
    }

    return (
        <SidebarContext.Provider value={{ isOpen: sidebarOpen, setIsOpen: setSidebarOpen, isMobile }}>
            <div className="flex min-h-screen bg-[#0a0a0f]">
                <Sidebar logo={logo} categories={categories} footer={sidebarFooter} />

                <div className="flex-1 flex flex-col min-w-0">
                    <Header
                        title={headerTitle}
                        subtitle={headerSubtitle}
                        actions={headerActions}
                        showSearch={showSearch}
                        onSearch={onSearch}
                    />

                    <PageContent className="p-4 lg:p-6">
                        {children}
                    </PageContent>
                </div>
            </div>
        </SidebarContext.Provider>
    );
}

// Export all components
export { Sidebar, Header, PageContent, SidebarNav };
export type { NavItem, NavCategory, HeaderProps, Tab };
