"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useUserSync } from '@/hooks/useUserSync'

interface UserContextType {
    user: any | null
    address: string | undefined
    isConnected: boolean
    isSynced: boolean
    isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
    const userSync = useUserSync()

    return (
        <UserContext.Provider value={userSync}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
