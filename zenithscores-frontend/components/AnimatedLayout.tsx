'use client';

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

/**
 * AnimatedLayout - Motion-powered layout animations for smooth page transitions
 * 
 * Features:
 * - Automatic page transitions with crossfade
 * - Layout animations using Motion's layout prop
 * - LayoutGroup for synchronized animations across components
 * - Shared element transitions via layoutId
 * 
 * Based on: https://motion.dev/docs/react-layout-animations
 */

interface AnimatedLayoutProps {
    children: ReactNode;
    className?: string;
}

// Page transition variants
const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98,
    },
    enter: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            staggerChildren: 0.05,
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.99,
        transition: {
            duration: 0.25,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        },
    },
};

// Fade variants for simpler transitions
const fadeVariants = {
    initial: { opacity: 0 },
    enter: {
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' as const }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2, ease: 'easeIn' as const }
    },
};

// Slide up variants for list items
const slideUpVariants = {
    initial: { opacity: 0, y: 30 },
    enter: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: { duration: 0.2 }
    },
};

/**
 * Main animated layout wrapper with page transitions
 */
export function AnimatedLayout({ children, className = '' }: AnimatedLayoutProps) {
    const pathname = usePathname();

    return (
        <LayoutGroup>
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={pathname}
                    variants={pageVariants}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    className={className}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </LayoutGroup>
    );
}

/**
 * Animated container for sections that should animate together
 */
interface AnimatedSectionProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    layoutId?: string;
}

export function AnimatedSection({
    children,
    className = '',
    delay = 0,
    layoutId
}: AnimatedSectionProps) {
    return (
        <motion.section
            layout
            layoutId={layoutId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{
                duration: 0.4,
                delay,
                ease: [0.22, 1, 0.36, 1],
                layout: { duration: 0.3 }
            }}
            className={className}
        >
            {children}
        </motion.section>
    );
}

/**
 * Animated list container - wraps list items for staggered animations
 */
interface AnimatedListProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
}

export function AnimatedList({
    children,
    className = '',
    staggerDelay = 0.05
}: AnimatedListProps) {
    return (
        <motion.div
            layout
            initial="initial"
            animate="enter"
            exit="exit"
            variants={{
                initial: {},
                enter: {
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: 0.1,
                    },
                },
                exit: {
                    transition: {
                        staggerChildren: 0.03,
                        staggerDirection: -1,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/**
 * Animated list item - use inside AnimatedList
 */
interface AnimatedListItemProps {
    children: ReactNode;
    className?: string;
    layoutId?: string;
}

export function AnimatedListItem({
    children,
    className = '',
    layoutId
}: AnimatedListItemProps) {
    return (
        <motion.div
            layout
            layoutId={layoutId}
            variants={slideUpVariants}
            className={className}
            style={{ borderRadius: 12 }}
        >
            {children}
        </motion.div>
    );
}

/**
 * Shared element for cross-page animations
 */
interface SharedElementProps {
    children: ReactNode;
    layoutId: string;
    className?: string;
    onClick?: () => void;
}

export function SharedElement({
    children,
    layoutId,
    className = '',
    onClick
}: SharedElementProps) {
    return (
        <motion.div
            layoutId={layoutId}
            layout
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
            }}
            className={className}
            onClick={onClick}
            style={{ borderRadius: 12 }}
        >
            {children}
        </motion.div>
    );
}

/**
 * Animated card with expand/collapse functionality
 */
interface AnimatedCardProps {
    children: ReactNode;
    className?: string;
    layoutId?: string;
    isExpanded?: boolean;
    onClick?: () => void;
}

export function AnimatedCard({
    children,
    className = '',
    layoutId,
    isExpanded = false,
    onClick
}: AnimatedCardProps) {
    return (
        <motion.div
            layout
            layoutId={layoutId}
            animate={{
                scale: isExpanded ? 1.02 : 1,
            }}
            transition={{
                layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
            }}
            className={className}
            onClick={onClick}
            style={{ borderRadius: 16 }}
        >
            {children}
        </motion.div>
    );
}

/**
 * Tab indicator that animates between tabs
 */
interface TabIndicatorProps {
    layoutId?: string;
    className?: string;
}

export function TabIndicator({
    layoutId = 'tab-indicator',
    className = ''
}: TabIndicatorProps) {
    return (
        <motion.div
            layoutId={layoutId}
            className={`absolute inset-0 bg-white/10 rounded-lg ${className}`}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
            }}
            style={{ borderRadius: 8 }}
        />
    );
}

/**
 * Animated tabs component
 */
interface Tab {
    id: string;
    label: string;
    icon?: ReactNode;
}

interface AnimatedTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
    layoutId?: string;
}

export function AnimatedTabs({
    tabs,
    activeTab,
    onTabChange,
    className = '',
    layoutId = 'tabs'
}: AnimatedTabsProps) {
    return (
        <div className={`flex gap-1 p-1 bg-white/5 rounded-xl ${className}`}>
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors z-10 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                        }`}
                >
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId={`${layoutId}-indicator`}
                            className="absolute inset-0 bg-white/10 rounded-lg"
                            transition={{
                                type: 'spring',
                                stiffness: 400,
                                damping: 30,
                            }}
                            style={{ borderRadius: 8 }}
                        />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                        {tab.icon}
                        {tab.label}
                    </span>
                </button>
            ))}
        </div>
    );
}

/**
 * Animated accordion/collapsible section
 */
interface AnimatedAccordionProps {
    children: ReactNode;
    isOpen: boolean;
    className?: string;
}

export function AnimatedAccordion({
    children,
    isOpen,
    className = ''
}: AnimatedAccordionProps) {
    return (
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    layout
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                        height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                        opacity: { duration: 0.2 },
                    }}
                    className={`overflow-hidden ${className}`}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Animated modal with shared element transition
 */
interface AnimatedModalProps {
    children: ReactNode;
    isOpen: boolean;
    onClose: () => void;
    layoutId?: string;
    className?: string;
}

export function AnimatedModal({
    children,
    isOpen,
    onClose,
    layoutId,
    className = ''
}: AnimatedModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    <motion.div
                        layoutId={layoutId}
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{
                            type: 'spring',
                            stiffness: 400,
                            damping: 30,
                        }}
                        className={`fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 
                       md:max-w-lg md:w-full z-50 ${className}`}
                        style={{ borderRadius: 20 }}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * Grid container with layout animations
 */
interface AnimatedGridProps {
    children: ReactNode;
    className?: string;
    columns?: number;
}

export function AnimatedGrid({
    children,
    className = '',
    columns = 3
}: AnimatedGridProps) {
    return (
        <motion.div
            layout
            className={`grid gap-4 ${className}`}
            style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
            transition={{ layout: { duration: 0.3 } }}
        >
            {children}
        </motion.div>
    );
}

export { pageVariants, fadeVariants, slideUpVariants };
