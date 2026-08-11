import { logger } from '@shared/logger/logger.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { 
    getVerificationTemplate,
    getOTPTemplate,
    getPasswordResetTemplate, 
    getWelcomeTemplate,
    getKYCApprovedTemplate,
    getKYCRejectedTemplate,
    getOrganizerApprovedTemplate,
    getOrganizerRejectedTemplate,
    getContactReplyTemplate,
    getChitGroupCreatedTemplate
} from './emailTemplates.js';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendVerificationEmail = async (email: string, token: string, otp?: string) => {
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: `DigiChit <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Verify your DigiChit Account',
        html: getVerificationTemplate(verificationLink, otp),
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Verification email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending email:', error);
    }
};

export const sendOTPEmail = async (email: string, otp: string, name?: string) => {
    const mailOptions = {
        from: `DigiChit Security <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Your DigiChit One-Time Passcode (OTP)',
        html: getOTPTemplate(otp, name),
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`OTP email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending OTP email:', error);
    }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
    const mailOptions = {
        from: `DigiChit Team <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Welcome to DigiChit - Account Active!',
        html: getWelcomeTemplate(name),
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Welcome email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending welcome email:', error);
    }
};

export const sendPasswordResetEmail = async (email: string, token: string, otp?: string) => {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from: `DigiChit Security <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Reset your DigiChit Password',
        html: getPasswordResetTemplate(resetLink, otp),
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Password reset email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending password reset email:', error);
    }
};

export const sendKYCApprovedEmail = async (email: string, name: string) => {
    const mailOptions = {
        from: `DigiChit Compliance <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'KYC Verification Approved - DigiChit',
        html: getKYCApprovedTemplate(name),
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`KYC Approved email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending KYC Approved email:', error);
    }
};

export const sendKYCRejectedEmail = async (email: string, name: string, reason: string) => {
    const mailOptions = {
        from: `DigiChit Compliance <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'KYC Verification Action Required - DigiChit',
        html: getKYCRejectedTemplate(name, reason),
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`KYC Rejected email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending KYC Rejected email:', error);
    }
};

export const sendOrganizerApprovedEmail = async (email: string, name: string) => {
    const mailOptions = {
        from: `DigiChit Admin <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Organizer Privileges Approved - DigiChit',
        html: getOrganizerApprovedTemplate(name),
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Organizer Approved email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending Organizer Approved email:', error);
    }
};

export const sendOrganizerRejectedEmail = async (email: string, name: string, reason: string) => {
    const mailOptions = {
        from: `DigiChit Admin <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Organizer Application Status - DigiChit',
        html: getOrganizerRejectedTemplate(name, reason),
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Organizer Rejected email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending Organizer Rejected email:', error);
    }
};

export const sendContactReplyEmail = async (email: string, name: string, originalMessage: string, adminResponse: string) => {
    const mailOptions = {
        from: `DigiChit Support <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Response to your DigiChit Support Inquiry',
        html: getContactReplyTemplate(name, originalMessage, adminResponse),
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Contact Reply email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending Contact Reply email:', error);
    }
};

export const sendChitGroupCreatedEmail = async (email: string, name: string, groupName: string, contribution: number, members: number, startDate: string) => {
    const mailOptions = {
        from: `DigiChit Circles <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `Financial Circle Established: ${groupName}`,
        html: getChitGroupCreatedTemplate(name, groupName, contribution, members, startDate),
    };

    try {
        await transporter.sendMail(mailOptions);
        logger.info(`Chit Group Created email sent to ${email}`);
    } catch (error) {
        logger.error('Error sending Chit Group Created email:', error);
    }
};
