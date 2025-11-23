"use client"

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { contracts } from '@/lib/contracts'

export function useChamaGovernor(governorAddress: `0x${string}`) {
    const { data: hash, writeContract, isPending, error } = useWriteContract()

    const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const propose = async (targets: `0x${string}`[], values: bigint[], calldatas: `0x${string}`[], description: string) => {
        try {
            console.log('[propose] Calling writeContract with:', {
                governorAddress,
                targets,
                values: values.map(v => v.toString()),
                calldatas,
                description
            })

            await writeContract({
                address: governorAddress,
                abi: contracts.governor.abi,
                functionName: 'propose',
                args: [targets, values, calldatas, description],
            })
        } catch (err) {
            console.error('[propose] Error:', err)
            throw err
        }
    }

    const castVote = async (proposalId: bigint, support: number) => {
        writeContract({
            address: governorAddress,
            abi: contracts.governor.abi,
            functionName: 'castVote',
            args: [proposalId, support],
        })
    }

    const execute = async (targets: `0x${string}`[], values: bigint[], calldatas: `0x${string}`[], descriptionHash: `0x${string}`) => {
        writeContract({
            address: governorAddress,
            abi: contracts.governor.abi,
            functionName: 'execute',
            args: [targets, values, calldatas, descriptionHash],
        })
    }

    return { propose, castVote, execute, isPending, isConfirming, isSuccess, hash, error, receipt }
}
