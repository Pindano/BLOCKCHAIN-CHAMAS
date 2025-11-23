"use server"

import { uploadToIPFS } from "@/lib/ipfs-service"
import type { Constitution } from "@/lib/types"

export async function uploadConstitutionToIPFS(constitution: Constitution): Promise<string> {
  try {
    const cid = await uploadToIPFS(JSON.stringify(constitution), "constitution")
    console.log("[v0] Constitution uploaded to IPFS:", cid)
    return cid
  } catch (error) {
    console.error("[v0] Error uploading constitution:", error)
    throw new Error("Failed to upload constitution to IPFS")
  }
}

