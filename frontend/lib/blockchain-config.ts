// Blockchain configuration and constants
export const BLOCKCHAIN_CONFIG = {
    CHAIN_ID: 84532, // Base Sepolia
    RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
    FACTORY_ADDRESS: process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`,
}

export const PROPOSAL_TYPES = {
    ADD_MEMBER: "ADD_MEMBER",
    REMOVE_MEMBER: "REMOVE_MEMBER",
    MEMBER_EXIT: "MEMBER_EXIT",
    LOAN_REQUEST: "LOAN_REQUEST",
    CONSTITUTION_EDIT: "CONSTITUTION_EDIT",
    IPFS_CONSTITUTION_UPDATED: "IPFSConstitutionUpdated",
    CONTRIBUTION: "CONTRIBUTION",
    CONTRIBUTION_RECONCILIATION: "CONTRIBUTION_RECONCILIATION",
} as const

export type ProposalType = (typeof PROPOSAL_TYPES)[keyof typeof PROPOSAL_TYPES]

export const IPFS_CONFIG = {
    PINATA_GATEWAY: "https://gateway.pinata.cloud/ipfs",
}

