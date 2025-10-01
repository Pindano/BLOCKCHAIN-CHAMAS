import { createBrowserClient } from "@supabase/ssr"

export interface Member {
  id: string
  wallet_address: string
  full_name: string
  email: string
  phone_number: string
  location: string
  investment_experience: "beginner" | "intermediate" | "experienced"
  monthly_contribution: string
  investment_goals?: string
  risk_tolerance: "conservative" | "moderate" | "aggressive"
  status: "pending" | "active" | "inactive" | "suspended"
  created_at: string
  updated_at: string
}

export interface WalletConnection {
  id: string
  member_id: string
  wallet_address: string
  connection_type: "coinbase" | "metamask" | "walletconnect"
  connected_at: string
  disconnected_at?: string
  is_active: boolean
  metadata: Record<string, any>
}

export interface OnboardingSession {
  id: string
  session_id: string
  wallet_address?: string
  current_step: number
  completed_steps: number[]
  form_data: Record<string, any>
  started_at: string
  completed_at?: string
  expires_at: string
  is_completed: boolean
}

// Create a singleton Supabase client
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return supabaseClient
}

// Database operations
export class ChamaDaoDatabase {
  private supabase = getSupabaseClient()

  // Set the current wallet address for RLS
  async setCurrentWalletAddress(walletAddress: string) {
    await this.supabase.rpc("set_config", {
      setting_name: "app.current_wallet_address",
      setting_value: walletAddress,
      is_local: true,
    })
  }

  // Member operations
  async createMember(
    memberData: Omit<Member, "id" | "created_at" | "updated_at" | "status">,
  ): Promise<{ data: Member | null; error: any }> {
    await this.setCurrentWalletAddress(memberData.wallet_address)

    const { data, error } = await this.supabase.from("members").insert([memberData]).select().single()

    return { data, error }
  }

  async getMemberByWalletAddress(walletAddress: string): Promise<{ data: Member | null; error: any }> {
    await this.setCurrentWalletAddress(walletAddress)

    const { data, error } = await this.supabase.from("members").select("*").eq("wallet_address", walletAddress).single()

    return { data, error }
  }

  async updateMember(walletAddress: string, updates: Partial<Member>): Promise<{ data: Member | null; error: any }> {
    await this.setCurrentWalletAddress(walletAddress)

    const { data, error } = await this.supabase
      .from("members")
      .update(updates)
      .eq("wallet_address", walletAddress)
      .select()
      .single()

    return { data, error }
  }

  // Wallet connection operations
  async createWalletConnection(
    connectionData: Omit<WalletConnection, "id" | "connected_at">,
  ): Promise<{ data: WalletConnection | null; error: any }> {
    await this.setCurrentWalletAddress(connectionData.wallet_address)

    const { data, error } = await this.supabase.from("wallet_connections").insert([connectionData]).select().single()

    return { data, error }
  }

  // Onboarding session operations
  async createOnboardingSession(
    sessionData: Omit<OnboardingSession, "id" | "started_at" | "expires_at">,
  ): Promise<{ data: OnboardingSession | null; error: any }> {
    if (sessionData.wallet_address) {
      await this.setCurrentWalletAddress(sessionData.wallet_address)
    }

    const { data, error } = await this.supabase.from("onboarding_sessions").insert([sessionData]).select().single()

    return { data, error }
  }

  async updateOnboardingSession(
    sessionId: string,
    updates: Partial<OnboardingSession>,
  ): Promise<{ data: OnboardingSession | null; error: any }> {
    const { data, error } = await this.supabase
      .from("onboarding_sessions")
      .update(updates)
      .eq("session_id", sessionId)
      .select()
      .single()

    return { data, error }
  }

  async getOnboardingSession(sessionId: string): Promise<{ data: OnboardingSession | null; error: any }> {
    const { data, error } = await this.supabase
      .from("onboarding_sessions")
      .select("*")
      .eq("session_id", sessionId)
      .single()

    return { data, error }
  }
}

// Singleton instance
let chamaDaoDb: ChamaDaoDatabase | null = null

export const getChamaDaoDatabase = (): ChamaDaoDatabase => {
  if (!chamaDaoDb) {
    chamaDaoDb = new ChamaDaoDatabase()
  }
  return chamaDaoDb
}
