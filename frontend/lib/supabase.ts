import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    wallet_address: string
                    name: string | null
                    email: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    wallet_address: string
                    name?: string | null
                    email?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    wallet_address?: string
                    name?: string | null
                    email?: string | null
                    created_at?: string
                }
            }
            chamas: {
                Row: {
                    id: string
                    governor_address: string
                    membership_token_address: string
                    name: string
                    description: string | null
                    constitution_ipfs_cid: string | null
                    creator_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    governor_address: string
                    membership_token_address: string
                    name: string
                    description?: string | null
                    constitution_ipfs_cid?: string | null
                    creator_id: string
                    created_at?: string
                }
            }
            proposals: {
                Row: {
                    id: string
                    on_chain_proposal_id: string
                    chama_id: string
                    title: string
                    description: string
                    ipfs_hash: string
                    proposer: string
                    status: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    on_chain_proposal_id: string
                    chama_id: string
                    title: string
                    description: string
                    ipfs_hash: string
                    proposer: string
                    status?: string
                    created_at?: string
                }
            }
        }
    }
}
