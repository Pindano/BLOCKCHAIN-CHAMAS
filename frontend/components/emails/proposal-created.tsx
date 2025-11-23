import * as React from 'react';
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';

interface ProposalCreatedEmailProps {
    memberName: string;
    chamaName: string;
    proposalTitle: string;
    proposalDescription: string;
    proposalLink: string;
}

export const ProposalCreatedEmail = ({
    memberName,
    chamaName,
    proposalTitle,
    proposalDescription,
    proposalLink,
}: ProposalCreatedEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>New Proposal in {chamaName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>New Proposal Created</Heading>
                    <Text style={text}>Hello {memberName},</Text>
                    <Text style={text}>
                        A new proposal has been created in <strong>{chamaName}</strong>.
                    </Text>
                    <Section style={section}>
                        <Text style={label}>Title:</Text>
                        <Text style={value}>{proposalTitle}</Text>
                        <Text style={label}>Description:</Text>
                        <Text style={value}>{proposalDescription}</Text>
                    </Section>
                    <Section style={btnContainer}>
                        <Link style={button} href={proposalLink}>
                            View Proposal
                        </Link>
                    </Section>
                    <Text style={footer}>
                        Chama DAO - Decentralized Group Management
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

const main = {
    backgroundColor: '#ffffff',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '560px',
};

const h1 = {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '40px 0',
    padding: '0',
    color: '#1a1a1a',
};

const text = {
    color: '#333',
    fontSize: '16px',
    lineHeight: '26px',
};

const section = {
    padding: '24px',
    border: '1px solid #e6e6e6',
    borderRadius: '4px',
    margin: '24px 0',
};

const label = {
    color: '#666',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
};

const value = {
    color: '#1a1a1a',
    fontSize: '16px',
    marginBottom: '16px',
};

const btnContainer = {
    textAlign: 'center' as const,
};

const button = {
    backgroundColor: '#000000',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px',
};

const footer = {
    color: '#898989',
    fontSize: '14px',
    marginTop: '24px',
};

export default ProposalCreatedEmail;
