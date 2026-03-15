import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { 
    getVerificationTemplate, 
    getPasswordResetTemplate, 
    getWelcomeTemplate,
    getKYCApprovedTemplate,
    getKYCRejectedTemplate
} from './emailTemplates.js';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendVerificationEmail = async (email: string, token: string) => {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: `DigiChit <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Verify your DigiChit Account',
        html: getVerificationTemplate(verificationLink),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Could not send verification email');
    }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: `DigiChit <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Reset your DigiChit Password',
        html: getPasswordResetTemplate(resetLink),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Could not send password reset email');
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    const mailOptions = {
        from: `DigiChit <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Welcome to DigiChit!',
        html: getWelcomeTemplate(name),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // We don't throw here to avoid breaking user flows if welcome email fails
    }
};

export const sendKYCApprovedEmail = async (email: string, name: string) => {
    const mailOptions = {
        from: `DigiChit Compliance <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'KYC Verified: Account Fully Activated',
        html: getKYCApprovedTemplate(name),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`KYC Approval email sent to ${email}`);
    } catch (error) {
        console.error('Error sending KYC approval email:', error);
    }
};

export const sendKYCRejectedEmail = async (email: string, name: string, reason: string) => {
    const mailOptions = {
        from: `DigiChit Compliance <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'KYC Action Required: Identity Verification Update',
        html: getKYCRejectedTemplate(name, reason),
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`KYC Rejection email sent to ${email}`);
    } catch (error) {
        console.error('Error sending KYC rejection email:', error);
    }
};

