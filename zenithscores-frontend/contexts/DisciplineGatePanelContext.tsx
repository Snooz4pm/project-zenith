'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface DisciplineGatePanelContextType {
    isOpen: boolean;
    openPanel: () => void;
    closePanel: () => void;
    togglePanel: () => void;
}

const DisciplineGatePanelContext = createContext<DisciplineGatePanelContextType>({
    isOpen: false,
    openPanel: () => { },
    closePanel: () => { },
    togglePanel: () => { }
});

export function useDisciplineGatePanel() {
    return useContext(DisciplineGatePanelContext);
}

export function DisciplineGatePanelProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <DisciplineGatePanelContext.Provider value={{
            isOpen,
            openPanel: () => setIsOpen(true),
            closePanel: () => setIsOpen(false),
            togglePanel: () => setIsOpen(prev => !prev)
        }}>
            {children}
        </DisciplineGatePanelContext.Provider>
    );
}
