# Chama DAO App

A modern web application for managing **Chamas** (rotating savings and credit associations) with decentralized autonomous organization (DAO) features. Users can create and manage chamas, propose decisions, vote on proposals, and manage their finances collaboratively using blockchain-backed wallets.

## Features

### 🔐 Authentication
- **Email + OTP Authentication**: Simple and secure sign-up and sign-in using email verification
- **Coinbase Embedded Wallets**: Each user gets a blockchain wallet tied to their email
- **One-Time Passwords**: Secure OTP verification for authentication

### 👤 User Management
- **Profile Management**: Edit personal information (first name, last name, phone, ID)
- **Profile Photos**: Upload and manage profile pictures
- **Wallet Integration**: View and manage your blockchain wallet address
- **Account Management**: Delete account and manage preferences

### 💰 Chama Management
- **Create Chamas**: Start new savings groups with customizable settings
- **Join Chamas**: Browse and join existing chamas
- **Invite Members**: Invite people to your chama via email
- **Leave Chamas**: Exit chamas you're no longer part of
- **Member Roles**: Different roles with varying permissions (Admin, Member, Treasurer)
- **Voting Power**: Members have voting power based on their contributions

### 🗳️ DAO & Proposals
- **Create Proposals**: Propose decisions for the chama (e.g., loan approvals, fund distributions)
- **Vote on Proposals**: Vote for, against, or abstain on proposals
- **Proposal Management**: Edit and delete your own proposals
- **Voting Results**: View real-time voting statistics and percentages
- **Proposal Timeline**: Track proposal creation and voting deadlines

### 📊 Dashboard
- **Overview**: See your chamas, proposals, and wallet balance at a glance
- **Chama Details**: View comprehensive chama information including members and financial status
- **Proposal Details**: See full proposal details with voting breakdown
- **Financial Tracking**: Monitor contributions, loans, and transactions

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Coinbase Embedded Wallets (CDP SDK)
- **State Management**: React hooks, SWR for data fetching
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Coinbase CDP account and project ID

## Setup Instructions

### 1. Clone and Install

\`\`\`bash
# Clone the repository
git clone <your-repo-url>
cd chama-app

# Install dependencies
npm install
\`\`\`

### 2. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Coinbase CDP
NEXT_PUBLIC_CDP_PROJECT_ID=your_cdp_project_id
\`\`\`

### 3. Database Setup

1. Go to your Supabase dashboard
2. Open the SQL Editor
3. Run the migration script from `scripts/01-create-tables.sql`
4. Run the RLS policy script from `scripts/02-disable-rls.sql`

### 4. Run Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication Flow

### First Time Users (Sign Up)
1. Enter email address
2. Verify OTP sent to email
3. Coinbase creates a wallet for the user
4. User completes profile (first name, last name, phone, ID)
5. User is redirected to dashboard

### Returning Users (Sign In)
1. Enter email address
2. Verify OTP sent to email
3. User is redirected to dashboard

## Database Schema

### Core Tables

**users**
- `user_id`: UUID (Primary Key)
- `email`: Email address (unique)
- `wallet_address`: Blockchain wallet address
- `first_name`: User's first name
- `last_name`: User's last name
- `phone`: Phone number
- `id_number`: National ID or passport number
- `profile_photo_url`: URL to profile picture
- `bio`: User biography
- `created_at`: Account creation timestamp

**chamas**
- `chama_id`: UUID (Primary Key)
- `name`: Chama name
- `description`: Chama description
- `creator_id`: UUID (Foreign Key to users)
- `investment_type`: Type of investment (e.g., "Savings", "Loan")
- `currency`: Currency used (e.g., "KES", "USD")
- `target_amount`: Target savings amount
- `current_amount`: Current accumulated amount
- `status`: Chama status (Active, Inactive, Completed)
- `created_at`: Creation timestamp

**chama_members**
- `member_id`: UUID (Primary Key)
- `chama_id`: UUID (Foreign Key to chamas)
- `user_id`: UUID (Foreign Key to users)
- `role`: Member role (Admin, Treasurer, Member)
- `voting_power`: Voting power percentage
- `joined_at`: Join timestamp

**proposals**
- `proposal_id`: UUID (Primary Key)
- `chama_id`: UUID (Foreign Key to chamas)
- `creator_id`: UUID (Foreign Key to users)
- `title`: Proposal title
- `description`: Proposal description
- `proposal_type`: Type of proposal (e.g., "Loan", "Distribution")
- `status`: Proposal status (Pending, Approved, Rejected, Executed)
- `created_at`: Creation timestamp
- `voting_deadline`: Deadline for voting

**votes**
- `vote_id`: UUID (Primary Key)
- `proposal_id`: UUID (Foreign Key to proposals)
- `voter_id`: UUID (Foreign Key to users)
- `vote_type`: Vote type (For, Against, Abstain)
- `created_at`: Vote timestamp

**Supporting Tables**
- `wallet_connections`: Track wallet connections
- `financial_transactions`: Record all financial transactions
- `member_contributions`: Track member contributions
- `loans`: Manage loans within chamas



## Usage Guide

### Creating a Chama
1. Go to Dashboard → Chamas
2. Click "Create Chama"
3. Fill in chama details (name, description, investment type, target amount)
4. Click "Create"

### Joining a Chama
1. Go to Dashboard → Chamas
2. Browse available chamas
3. Click "Join" on a chama
4. Confirm to join

### Creating a Proposal
1. Go to Dashboard → Proposals
2. Click "Create Proposal"
3. Fill in proposal details (title, description, type)
4. Set voting deadline
5. Click "Create"

### Voting on a Proposal
1. Go to Dashboard → Proposals
2. Find the proposal you want to vote on
3. Click "Vote"
4. Select your vote (For, Against, Abstain)
5. Confirm


## Troubleshooting

### "Project ID is required" Error
- Make sure `NEXT_PUBLIC_CDP_PROJECT_ID` is set in your environment variables
- Restart the development server after adding the variable

### "User is already authenticated" Error
- This is handled automatically - the app detects existing sessions and redirects appropriately
- Clear browser cookies if you encounter persistent issues

### No Data in Database
- Ensure the SQL migration scripts have been run in Supabase
- Check that RLS policies are disabled 
- Verify Supabase credentials in environment variables

### Wallet Not Creating
- Ensure Coinbase CDP Project ID is correct
- Check browser console for CDP SDK errors
- Verify you have sufficient permissions in Coinbase CDP dashboard


## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database schema
3. Check browser console for error messages
4. Open an issue on GitHub

