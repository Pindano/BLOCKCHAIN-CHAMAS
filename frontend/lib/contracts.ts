import { CHAMA_FACTORY_ABI, CHAMA_GOVERNOR_ABI } from './contract-abis'

export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}`

export const contracts = {
    factory: {
        address: FACTORY_ADDRESS,
        abi: CHAMA_FACTORY_ABI,
    },
    governor: {
        abi: CHAMA_GOVERNOR_ABI,
    }
} as const
