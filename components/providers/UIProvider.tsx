'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

type UIContextType = {
    activeDropdown: string | null
    setActiveDropdown: (id: string | null) => void
    closeAll: () => void
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: React.ReactNode }) {
    const [activeDropdown, setActiveDropdownState] = useState<string | null>(null)

    const setActiveDropdown = useCallback((id: string | null) => {
        setActiveDropdownState(id)
    }, [])

    const closeAll = useCallback(() => {
        setActiveDropdownState(null)
    }, [])

    return (
        <UIContext.Provider value={{ activeDropdown, setActiveDropdown, closeAll }}>
            {children}
        </UIContext.Provider>
    )
}

export function useUI() {
    const context = useContext(UIContext)
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider')
    }
    return context
}
