import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { contracts } from '@/lib/contracts'

export function useChamaFactory() {
    const { data: hash, writeContract, isPending, error } = useWriteContract()

    const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    })

    const createChama = async (name: string, symbol: string, founders: `0x${string}`[]) => {
        if (!founders.length) throw new Error("At least one founder required")

        writeContract({
            address: contracts.factory.address,
            abi: contracts.factory.abi,
            functionName: 'createChama',
            args: [name, symbol, founders, founders[0]],
        })
    }

    return { createChama, isPending, isConfirming, isSuccess, hash, error, receipt }
}