// Server action for IPFS uploads - keeps API key secure
"use server"

export interface ProposalMetadata {
  title: string
  description: string
  proposalType: string
  targetAmount?: number
  deadline?: string
  creator: string
  createdAt: string
  tags?: string[]
}

export async function uploadProposalToIPFS(data: any): Promise<string> {
  try {
    const pinataJWT = process.env.PINATA_JWT
    if (!pinataJWT) {
      console.error("PINATA_JWT environment variable is not set")
      throw new Error("PINATA_JWT environment variable is not set. Please add it to your .env file.")
    }

    const formData = new FormData()
    formData.append("file", new Blob([JSON.stringify(data)], { type: "application/json" }), "data.json")

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${pinataJWT}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("IPFS upload failed:", response.status, errorText)
      throw new Error(`Failed to upload to IPFS: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("[IPFS] Uploaded successfully:", result.IpfsHash)
    return result.IpfsHash
  } catch (error: any) {
    console.error("[IPFS] Error uploading:", error)
    throw new Error(error.message || "Failed to upload to IPFS")
  }
}

export async function getIPFSUrl(hash: string): string {
  return `https://gateway.pinata.cloud/ipfs/${hash}`
}
