'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalDropdownProps {
    isOpen: boolean;
    anchorRef: React.RefObject<HTMLElement>;
    children: React.ReactNode;
    align?: 'left' | 'center' | 'right';
    offsetY?: number;
}

/**
 * Portal Dropdown - Renders dropdown at document.body level
 * to escape all stacking contexts. Uses isolation: isolate
 * and z-index: 10000 to always appear on top.
 */
export function PortalDropdown({
    isOpen,
    anchorRef,
    children,
    align = 'center',
    offsetY = 8
}: PortalDropdownProps) {
    const [mounted, setMounted] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen || !anchorRef.current) return;

        const updatePosition = () => {
            const rect = anchorRef.current?.getBoundingClientRect();
            if (!rect) return;

            let left = rect.left;
            if (align === 'center') {
                left = rect.left + rect.width / 2;
            } else if (align === 'right') {
                left = rect.right;
            }

            setPosition({
                top: rect.bottom + offsetY,
                left
            });
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, anchorRef, align, offsetY]);

    if (!mounted || !isOpen) return null;

    const transformOrigin = align === 'right' ? 'top right' : align === 'center' ? 'top center' : 'top left';
    const translateX = align === 'right' ? '-100%' : align === 'center' ? '-50%' : '0';

    return createPortal(
        <div
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                transform: `translateX(${translateX})`,
                transformOrigin,
                zIndex: 10000,
                isolation: 'isolate'
            }}
            className="animate-in fade-in-0 zoom-in-95 duration-200"
        >
            {children}
        </div>,
        document.body
    );
}

export default PortalDropdown;
