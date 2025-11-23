# 🌍 ChamaDao - Blockchain-Powered Community Savings Platform

A decentralized application (dApp) that brings traditional African Chama savings groups to the blockchain. Built with Next.js, TypeScript, and smart contracts, ChamaDao enables transparent, democratic, and secure community savings with on-chain governance.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Contributing](#contributing)

## 🎯 Overview

**ChamaDao** modernizes the traditional African Chama (informal savings group) by leveraging blockchain technology to provide:

- **Transparency**: All contributions and transactions recorded on-chain
- **Democratic Governance**: Members vote on proposals using on-chain voting mechanisms
- **Security**: Smart contract-based fund management and automated payouts
- **Accessibility**: Easy-to-use interface for creating, joining, and managing Chamas

### What is a Chama?

A Chama is a traditional East African savings group where members pool resources and support each other financially. ChamaDao brings this time-tested community savings model to Web3, making it more transparent, secure, and accessible to communities across Africa and beyond.

## ✨ Key Features

### 🏦 Chama Management
- **Create Public or Private Chamas** - Set up savings groups with customizable parameters
- **Invite Members** - Add participants via email invitations with verification
- **Track Contributions** - Real-time dashboard showing pot size, members, and payout schedules
- **Automated Payouts** - Smart contract-managed distribution based on rotation

### 🗳️ Democratic Governance
- **On-Chain Proposals** - Members can create and submit proposals for voting
- **Transparent Voting** - Every member gets a vote on important decisions
- **Proposal Types**:
  - Member additions/removals
  - Contribution amount changes
  - Payout schedule modifications
  - Emergency fund withdrawals

### 👤 User Features
- **Coinbase Wallet Integration** - Embedded wallet authentication
- **User Profiles** - Manage personal information and Chama memberships
- **Dashboard** - Overview of all joined Chamas, pending proposals, and activities
- **Loan System** - Request and manage loans within your Chama (coming soon)

### 🔒 Security & Transparency
- **Smart Contracts** - Built on Ethereum/EVM-compatible chains
- **Membership NFTs** - ERC-721 tokens representing Chama membership
- **Verifiable Transactions** - All contributions and payouts recorded on-chain
- **Multi-signature Support** - Enhanced security for fund management

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **Notifications**: Sonner (toast notifications)
- **Forms**: React Hook Form + Zod validation

### Blockchain & Web3
- **Wallet Integration**: Coinbase CDP SDK (`@coinbase/cdp-react`, `@coinbase/cdp-wagmi`)
- **Web3 Library**: Wagmi + Viem + Ethers.js
- **Smart Contracts**: Solidity (Foundry framework)
- **Query Management**: TanStack React Query

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Coinbase Embedded Wallets
- **Email**: Resend + React Email
- **API Routes**: Next.js API routes

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Smart Contract Framework**: Foundry

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Foundry** (for smart contract development)
- **Coinbase Developer Account** (for wallet integration)
- **Supabase Account** (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BLOCKCHAIN-CHAMAS/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Coinbase CDP
   NEXT_PUBLIC_CDP_API_KEY=your_coinbase_api_key
   NEXT_PUBLIC_CDP_PROJECT_ID=your_coinbase_project_id

   # Blockchain
   NEXT_PUBLIC_CHAIN_ID=your_chain_id
   NEXT_PUBLIC_CHAMA_FACTORY_ADDRESS=factory_contract_address
   
   # Email (Resend)
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Smart Contract Setup

The smart contracts are located in the `/contracts` directory:

```bash
cd contracts

# Install dependencies
forge install

# Compile contracts
forge build

# Run tests
forge test

# Deploy contracts
forge script script/Deploy.s.sol --rpc-url <your_rpc_url> --private-key <your_private_key>
```

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js app router pages
│   ├── actions/                  # Server actions
│   ├── api/                      # API routes
│   ├── auth/                     # Authentication pages
│   │   ├── profile/              # User profile setup
│   │   └── verify/               # Email verification
│   ├── chama/[id]/              # Individual Chama page
│   ├── dashboard/               # Main dashboard
│   │   ├── loans/               # Loan management
│   │   └── proposals/           # Proposal management
│   ├── profile/                 # User profile page
│   ├── proposal/[id]/          # Individual proposal page
│   └── page.tsx                 # Landing page
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard/               # Dashboard-specific components
│   └── ...                      # Other shared components
│
├── contracts/                    # Smart contracts (Foundry)
│   ├── src/                     # Solidity source files
│   │   ├── ChamaFactory.sol     # Factory for creating Chamas
│   │   ├── ChamaGovernor.sol    # Governance contract
│   │   └── ChamaMembershipToken.sol # ERC-721 membership NFTs
│   ├── script/                  # Deployment scripts
│   └── test/                    # Contract tests
│
├── hooks/                       # Custom React hooks
├── lib/                         # Utility functions
│   ├── supabase/               # Supabase client
│   └── utils.ts                # Helper functions
│
└── public/                      # Static assets
```

## 📜 Smart Contracts

### ChamaFactory.sol
Factory contract for creating and managing new Chama instances. Handles deployment and registration of Chamas.

**Key Functions:**
- `createChama()` - Deploy a new Chama with specified parameters
- `getChamasByCreator()` - Retrieve Chamas created by an address
- `getAllChamas()` - Get list of all deployed Chamas

### ChamaGovernor.sol
Governor contract implementing on-chain voting and proposal execution.

**Key Functions:**
- `propose()` - Create a new proposal
- `castVote()` - Vote on active proposals
- `execute()` - Execute passed proposals
- `getProposalState()` - Check proposal status

### ChamaMembershipToken.sol
ERC-721 NFT representing membership in a Chama. Required for voting and participation.

**Key Functions:**
- `mint()` - Issue membership NFT to new member
- `burn()` - Remove membership when member leaves
- `balanceOf()` - Check if address is a member

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJxxx...` |
| `NEXT_PUBLIC_CDP_API_KEY` | Coinbase CDP API key | `cdp_xxx` |
| `NEXT_PUBLIC_CDP_PROJECT_ID` | Coinbase project ID | `xxx-xxx-xxx` |
| `NEXT_PUBLIC_CHAIN_ID` | Blockchain network ID | `84532` (Base Sepolia) |
| `NEXT_PUBLIC_CHAMA_FACTORY_ADDRESS` | Deployed factory contract | `0x123...` |
| `RESEND_API_KEY` | Resend email API key | `re_xxx` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `false` |

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server on localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Write meaningful commit messages
   - Test your changes thoroughly

3. **Test locally**
   ```bash
   npm run dev
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines

- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Use meaningful variable and function names
- Comment complex logic
- Keep components focused and reusable
- Use Tailwind CSS for styling (avoid inline styles)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🌟 Acknowledgments

- Inspired by traditional African Chama savings groups
- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Wallet integration powered by [Coinbase CDP](https://www.coinbase.com/cloud)
- Database and auth by [Supabase](https://supabase.com/)

## 📞 Support

For support, please:
- Open an issue on GitHub
- Contact the development team
- Check the documentation

---

**Building wealth together across Africa** 🌍 Made with ❤️ in Kenya
