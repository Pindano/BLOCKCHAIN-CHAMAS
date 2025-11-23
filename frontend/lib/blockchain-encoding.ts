import { encodeFunctionData, parseEventLogs, type Abi } from "viem"
import { BLOCKCHAIN_CONFIG } from "./blockchain-config"
import { CHAMA_FACTORY_ABI, CHAMA_GOVERNOR_ABI } from "./contract-abis"

// Helper to encode contract function calls for Coinbase transaction signing
export function encodeCreateChama(
  chamaName: string,
  tokenSymbol: string,
  founders: string[],
  bankObserver: string,
): { to: `0x${string}`; data: `0x${string}` } {
  const data = encodeFunctionData({
    abi: CHAMA_FACTORY_ABI as Abi,
    functionName: "createChama",
    args: [chamaName, tokenSymbol, founders, bankObserver],
  })
  return {
    to: BLOCKCHAIN_CONFIG.FACTORY_ADDRESS,
    data,
  }
}

export function encodeCreateProposal(
  governorAddress: string,
  targets: string[],
  values: bigint[],
  calldatas: string[],
  description: string,
): { to: `0x${string}`; data: `0x${string}` } {
  const data = encodeFunctionData({
    abi: CHAMA_GOVERNOR_ABI as Abi,
    functionName: "propose",
    args: [targets, values, calldatas, description],
  })
  return {
    to: governorAddress as `0x${string}`,
    data,
  }
}

export function encodeCastVote(
  governorAddress: string,
  proposalId: bigint,
  support: number,
  reason = "", // you can keep this for future use
): { to: `0x${string}`; data: `0x${string}` } {
  // Use the correct function name
  if (reason && reason.length > 0) {
    // Optional: support reasons in the future
    const data = encodeFunctionData({
      abi: CHAMA_GOVERNOR_ABI as Abi,
      functionName: "castVoteWithReason",
      args: [proposalId, support, reason],
    })
    return { to: governorAddress as `0x${string}`, data }
  }

  // This is the one that works today
  const data = encodeFunctionData({
    abi: CHAMA_GOVERNOR_ABI as Abi,
    functionName: "castVote",
    args: [proposalId, support],
  })
  return { to: governorAddress as `0x${string}`, data }
}

/**
 * Extract proposal ID from ProposalCreated event logs
 */
export function extractProposalIdFromLogs(
  receipt: any,
  governorAbi: any
): string {
  const logs = parseEventLogs({
    abi: governorAbi as Abi,
    eventName: "ProposalCreated",
    logs: receipt.logs,
  })

  if (logs.length > 0) {
    // @ts-ignore - we know the shape of the args
    return logs[0].args.proposalId.toString()
  }

  throw new Error("ProposalCreated event not found in transaction logs")
}

// Extract contract addresses from transaction receipt logs
export function extractAddressesFromLogs(
  receipt: any,
  abi: any,
  eventName: string
) {
  console.log('Receipt:', receipt)
  console.log('Receipt logs:', receipt?.logs)

  if (!receipt?.logs || receipt.logs.length === 0) {
    throw new Error('No logs found in receipt')
  }

  const logs = parseEventLogs({
    abi: abi as Abi,
    eventName: eventName,
    logs: receipt.logs,
  })

  if (logs.length > 0) {
    const args = logs[0].args as any
    return {
      governor: args.governor,
      token: args.membershipToken
    }
  }

  throw new Error(`Event ${eventName} not found in receipt`)
}
