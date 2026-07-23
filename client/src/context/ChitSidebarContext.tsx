import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface Group {
    _id: string;
    name: string;
    status: string;
    organizerId: { _id: string; name: string; email: string };
}

export type ChitTab = 'OVERVIEW' | 'MEMBERS' | 'CYCLES' | 'AUCTIONS' | 'INSTALLMENTS' | 'HELP';

interface ChitSidebarState {
    group: Group | null;
    activeTab: ChitTab;
    pendingCount: number;
    isOrganizer: boolean;
    helpOpen: boolean;
}

interface ChitSidebarContextValue extends ChitSidebarState {
    setGroup: (g: Group | null) => void;
    setActiveTab: (tab: ChitTab) => void;
    setPendingCount: (n: number) => void;
    setIsOrganizer: (v: boolean) => void;
    setHelpOpen: (v: boolean) => void;
    reset: () => void;
}

const defaultState: ChitSidebarState = {
    group: null,
    activeTab: 'OVERVIEW',
    pendingCount: 0,
    isOrganizer: false,
    helpOpen: false,
};

const ChitSidebarContext = createContext<ChitSidebarContextValue>({
    ...defaultState,
    setGroup: () => {},
    setActiveTab: () => {},
    setPendingCount: () => {},
    setIsOrganizer: () => {},
    setHelpOpen: () => {},
    reset: () => {},
});

export const ChitSidebarProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<ChitSidebarState>(defaultState);

    const setGroup = useCallback((group: Group | null) => setState(s => ({ ...s, group })), []);
    const setActiveTab = useCallback((activeTab: ChitTab) => setState(s => ({ ...s, activeTab })), []);
    const setPendingCount = useCallback((pendingCount: number) => setState(s => ({ ...s, pendingCount })), []);
    const setIsOrganizer = useCallback((isOrganizer: boolean) => setState(s => ({ ...s, isOrganizer })), []);
    const setHelpOpen = useCallback((helpOpen: boolean) => setState(s => ({ ...s, helpOpen })), []);
    const reset = useCallback(() => setState(defaultState), []);

    return (
        <ChitSidebarContext.Provider value={{ ...state, setGroup, setActiveTab, setPendingCount, setIsOrganizer, setHelpOpen, reset }}>
            {children}
        </ChitSidebarContext.Provider>
    );
};

export const useChitSidebar = () => useContext(ChitSidebarContext);
