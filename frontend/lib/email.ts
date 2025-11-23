import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({
    to,
    subject,
    react,
}: {
    to: string;
    subject: string;
    react: React.ReactNode;
}) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Chama DAO <peter.gathoga@antugrow.com>', // Update this with your verified domain
            to,
            subject,
            react,
        });

        if (error) {
            console.error('Error sending email:', error);
            return { error };
        }

        return { data };
    } catch (error) {
        console.error('Error sending email:', error);
        return { error };
    }
};
