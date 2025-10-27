export interface User {
  user_id: string
  email: string
  wallet_address: string
  first_name: string | null
  last_name: string | null
  phone_number: string | null
  id_number: string | null
  profile_image_url: string | null
  bio: string | null
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface Chama {
  chama_id: string
  name: string
  description: string | null
  creator_id: string
  smart_contract_address: string | null
  investment_type: string | null
  target_amount: number | null
  current_amount: number
  currency: string
  is_active: boolean
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface ChamaMember {
  chama_member_id: string
  chama_id: string
  user_id: string
  role: string
  shares: number | null
  voting_power: number
  contributed_amount: number
  status: string
  joined_at: string
}

export interface Proposal {
  proposal_id: string
  chama_id: string
  creator_id: string
  title: string
  description: string | null
  proposal_type: string | null
  status: string
  votes_for: number
  votes_against: number
  votes_abstain: number
  voting_start: string | null
  voting_end: string | null
  execution_data: Record<string, any> | null
  blockchain_tx_hash: string | null
  created_at: string
  updated_at: string
}

export interface Vote {
  vote_id: string
  proposal_id: string
  user_id: string
  vote_choice: string
  voting_power: number | null
  comment: string | null
  blockchain_signature: string | null
  created_at: string
}
