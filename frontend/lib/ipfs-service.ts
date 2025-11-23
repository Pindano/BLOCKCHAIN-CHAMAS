// IPFS/Pinata service for storing proposal metadata
import axios from "axios"
import { IPFS_CONFIG } from "./blockchain-config"

const PINATA_API_URL = "https://api.pinata.cloud"

interface IPFSUploadResponse {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

interface ProposalMetadata {
  title: string
  description: string
  proposalType: string
  targetAmount?: number
  deadline?: string
  creator: string
  createdAt: string
  tags?: string[]
}

export async function uploadToIPFS(data: Record<string, any>): Promise<string> {
  try {
    const pinataJwt = process.env.PINATA_JWT
    if (!pinataJwt) {
      throw new Error("PINATA_JWT environment variable is not set")
    }

    const formData = new FormData()
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" })
    formData.append("file", blob, "proposal-metadata.json")

    const response = await axios.post<IPFSUploadResponse>(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
        "Content-Type": "multipart/form-data",
      },
    })

    console.log("[v0] IPFS upload successful:", response.data.IpfsHash)
    return response.data.IpfsHash
  } catch (error) {
    console.error("[v0] Error uploading to IPFS:", error)
    throw error
  }
}

export function getIPFSUrl(hash: string): string {
  return `${IPFS_CONFIG.PINATA_GATEWAY}/${hash}`
}

export async function fetchFromIPFS(hash: string): Promise<Record<string, any>> {
  try {
    const response = await fetch(getIPFSUrl(hash))
    if (!response.ok) {
      throw new Error("Failed to fetch from IPFS")
    }
    return response.json()
  } catch (error) {
    console.error("[v0] Error fetching from IPFS:", error)
    throw error
  }
}

