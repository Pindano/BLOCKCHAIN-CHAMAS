// lib/email-templates.tsx
import * as React from 'react';

interface EmailTemplateProps {
    chamaName: string;
    inviterName: string;
    message?: string;
}

export const InvitationEmail: React.FC<EmailTemplateProps> = ({
    chamaName,
    inviterName,
    message,
}) => (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#333' }}>You've been invited to join {chamaName}!</h2>
        <p>Hello,</p>
        <p>{inviterName} has invited you to join their Chama: <strong>{chamaName}</strong></p>
        {message && (
            <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px', margin: '20px 0' }}>
                <p style={{ margin: 0, fontStyle: 'italic' }}>"{message}"</p>
            </div>
        )}
        <p>Sign in to Chama DAO to accept or reject this invitation.</p>
        <a
            href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
            style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#000',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '5px',
                marginTop: '20px'
            }}
        >
            View Invitation
        </a>
    </div>
);

interface VoteConfirmationProps {
    proposalTitle: string;
    voteChoice: string;
    chamaName: string;
}

export const VoteConfirmationEmail: React.FC<VoteConfirmationProps> = ({
    proposalTitle,
    voteChoice,
    chamaName,
}) => (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#333' }}>Vote Confirmed!</h2>
        <p>Your vote has been successfully recorded.</p>
        <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px', margin: '20px 0' }}>
            <p style={{ margin: '5px 0' }}><strong>Chama:</strong> {chamaName}</p>
            <p style={{ margin: '5px 0' }}><strong>Proposal:</strong> {proposalTitle}</p>
            <p style={{ margin: '5px 0' }}><strong>Your Vote:</strong> <span style={{ textTransform: 'uppercase', color: '#4CAF50' }}>{voteChoice}</span></p>
        </div>
        <p>Thank you for participating in Chama governance!</p>
    </div>
);

interface ProposalActiveProps {
    proposalTitle: string;
    chamaName: string;
    proposalId: string;
}

export const ProposalActiveEmail: React.FC<ProposalActiveProps> = ({
    proposalTitle,
    chamaName,
    proposalId,
}) => (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#333' }}>New Proposal: {proposalTitle}</h2>
        <p>A new proposal is now active in <strong>{chamaName}</strong>!</p>
        <p>Cast your vote to participate in this important decision.</p>
        <a
            href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/proposals/${proposalId}`}
            style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#000',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '5px',
                marginTop: '20px'
            }}
        >
            View Proposal & Vote
        </a>
    </div>
);

interface ChamaCreatedProps {
    chamaName: string;
    chamaId: string;
}

export const ChamaCreatedEmail: React.FC<ChamaCreatedProps> = ({
    chamaName,
    chamaId,
}) => (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#333' }}>Chama Created Successfully!</h2>
        <p>Congratulations! Your Chama <strong>{chamaName}</strong> has been created.</p>
        <p>Next steps:</p>
        <ol>
            <li>Invite members to join your Chama</li>
            <li>Wait for members to accept invitations</li>
            <li>Publish your Chama on-chain to activate it</li>
        </ol>
        <a
            href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/chama/${chamaId}`}
            style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#000',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '5px',
                marginTop: '20px'
            }}
        >
            Manage Chama
        </a>
    </div>
);

interface ChamaPublishedProps {
    chamaName: string;
    chamaId: string;
}

export const ChamaPublishedEmail: React.FC<ChamaPublishedProps> = ({
    chamaName,
    chamaId,
}) => (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#333' }}>{chamaName} is now live!</h2>
        <p>Great news! The Chama <strong>{chamaName}</strong> has been published on-chain and is now fully active.</p>
        <p>You can now:</p>
        <ul>
            <li>Create and vote on proposals</li>
            <li>Make contributions</li>
            <li>Request loans</li>
            <li>Participate in governance</li>
        </ul>
        <a
            href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/chama/${chamaId}`}
            style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: '#000',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '5px',
                marginTop: '20px'
            }}
        >
            Go to Chama
        </a>
    </div>
);
