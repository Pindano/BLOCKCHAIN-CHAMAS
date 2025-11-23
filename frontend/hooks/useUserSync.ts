"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useIsSignedIn, useEvmAddress } from "@coinbase/cdp-hooks"
import { useAccount } from 'wagmi'

export function useUserSync() {
    const { isSignedIn } = useIsSignedIn()
    const { evmAddress } = useEvmAddress()
    const { address: wagmiAddress } = useAccount()

    // Prioritize CDP address but fallback to Wagmi address
    const isConnected = isSignedIn || !!wagmiAddress
    const address = evmAddress || wagmiAddress

    const [isSynced, setIsSynced] = useState(false)
    const [isLoading, setIsLoading] = useState(true) // Start loading true
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        let mounted = true

        async function syncUser() {
            // If not connected via either method, we are done loading and not synced
            if (!isConnected) {
                if (mounted) {
                    setUser(null)
                    setIsSynced(false)
                    setIsLoading(false)
                }
                return
            }

            // If connected but no address yet (rare but possible), keep loading
            if (!address) {
                return
            }

            if (mounted) setIsLoading(true)

            try {
                // Check if user exists
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .eq('wallet_address', address)
                    .single()

                if (mounted) {
                    if (data) {
                        setUser(data)
                        setIsSynced(true)
                    } else {
                        // User doesn't exist
                        setIsSynced(false)
                        setUser(null)
                    }
                }
            } catch (err) {
                console.error("Error syncing user:", err)
            } finally {
                if (mounted) setIsLoading(false)
            }
        }

        syncUser()

        return () => {
            mounted = false
        }
    }, [address, isConnected])

    return { isSynced, isLoading, user, address, isConnected }
}
