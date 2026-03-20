/**
 * DigiChit Premium Email Templates
 * Designed with a modern, fintech-grade aesthetic.
 */

const primaryColor = '#2563eb'; // Blue-600
const secondaryColor = '#1e293b'; // Slate-800
const accentColor = '#3b82f6'; // Blue-500

const baseStyles = `
    body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
    .header { background-color: ${secondaryColor}; padding: 32px; text-align: center; }
    .logo { color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: -0.025em; margin: 0; }
    .logo span { color: ${accentColor}; }
    .content { padding: 40px; }
    h2 { color: ${secondaryColor}; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 24px; }
    p { margin-bottom: 20px; font-size: 16px; color: #475569; }
    .button { display: inline-block; padding: 14px 32px; background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; transition: background-color 0.2s; text-align: center; }
    .footer { padding: 32px; background-color: #f1f5f9; text-align: center; font-size: 14px; color: #64748b; }
    .highlight { color: ${primaryColor}; font-weight: 600; }
    .warning { font-size: 13px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 24px; }
`;

export const getVerificationTemplate = (link: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">Digi<span>Chit</span></h1>
        </div>
        <div class="content">
            <h2>Verify your identity</h2>
            <p>Welcome to <span class="highlight">DigiChit</span>, the most secure community-based finance portal.</p>
            <p>To finalize your account setup and start participating in Chits, please click the button below to verify your email address.</p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${link}" class="button">Verify Email Address</a>
            </div>
            
            <p>This verification link will expire in <span class="highlight">15 minutes</span> for your security.</p>
            
            <div class="warning">
                If you did not create an account on our platform, you can safely ignore this email.
            </div>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} DigiChit Technologies<br>
            Secure Community Finance Ecosystem.
        </div>
    </div>
</body>
</html>
`;

export const getPasswordResetTemplate = (link: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">Digi<span>Chit</span></h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>You recently requested to reset your password for your <span class="highlight">DigiChit</span> account.</p>
            <p>Click the button below to choose a new password. This link is valid for <span class="highlight">1 hour</span>.</p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${link}" class="button">Reset Password</a>
            </div>
            
            <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <div class="warning">
                For security reasons, never share this link with anyone else. Our team will never ask for your password or reset link via phone or chat.
            </div>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} DigiChit Technologies<br>
            Secure Community Finance Ecosystem.
        </div>
    </div>
</body>
</html>
`;

export const getWelcomeTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">Digi<span>Chit</span></h1>
        </div>
        <div class="content">
            <h2>Welcome to the Circle, ${name}!</h2>
            <p>Your email has been successfully verified. You are now a full member of the <span class="highlight">DigiChit</span> community.</p>
            <p>DigiChit is built on trust and transparency. You can now explore available Chit groups, participate in auctions, and manage your community savings with ease.</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; font-weight: 600; color: ${secondaryColor};">What's Next?</p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #475569;">
                    <li>Complete your KYC for financial access</li>
                    <li>Browse active Chit groups</li>
                    <li>Invite friends to join your circle</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <p>We're excited to have you on board!</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} DigiChit Technologies<br>
            Secure Community Finance Ecosystem.
        </div>
    </div>
</body>
</html>
`;

export const getKYCApprovedTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="logo">Digi<span>Chit</span></h1>
        </div>
        <div class="content">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 20px; background-color: #ecfdf5; border-radius: 50%;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
            </div>
            <h2 style="text-align: center;">Identity Verified!</h2>
            <p>Hello <span class="highlight">${name}</span>,</p>
            <p>We are pleased to inform you that your <span class="highlight">KYC Verification</span> has been successfully processed and <span style="color: #10b981; font-weight: bold;">APPROVED</span>.</p>
            <p>Your account now has full access to the DigiChit ecosystem, including participating in high-value Chits and initiating withdrawals.</p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Access Full Features</a>
            </div>
            
            <p>Thank you for helping us maintain a secure financial community.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} DigiChit Technologies<br>
            Secure Community Finance Ecosystem.
        </div>
    </div>
</body>
</html>
`;

export const getKYCRejectedTemplate = (name: string, reason: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="background-color: #fca5a5;">
            <h1 class="logo">Digi<span>Chit</span></h1>
        </div>
        <div class="content">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 20px; background-color: #fef2f2; border-radius: 50%;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
            </div>
            <h2 style="text-align: center; color: #b91c1c;">KYC Action Required</h2>
            <p>Hello <span class="highlight">${name}</span>,</p>
            <p>Your recent <span class="highlight">KYC Verification</span> request could not be approved at this time.</p>
            
            <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 24px; margin: 30px 0; border-radius: 12px;">
                <p style="margin: 0; font-weight: 700; color: #9f1239; margin-bottom: 10px;">Reason for Rejection:</p>
                <p style="margin: 0; color: #be123c; font-style: italic;">"${reason}"</p>
            </div>
            
            <p>Please log in to your dashboard to review the feedback and resubmit your identification documents with the corrected information.</p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.FRONTEND_URL}/kyc/submit" class="button" style="background-color: #ef4444;">Resubmit Documents</a>
            </div>
            
            <p>If you have any questions, please reply to this email or contact our support team.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} DigiChit Technologies<br>
            Secure Community Finance Ecosystem.
        </div>
    </div>
</body>
</html>
`;
export const getOrganizerApprovedTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="background-color: #065f46;">
            <h1 class="logo">Digi<span>Chit</span></h1>
        </div>
        <div class="content">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 20px; background-color: #ecfdf5; border-radius: 50%;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
            </div>
            <h2 style="text-align: center; color: #065f46;">Organizer Privileges Granted!</h2>
            <p>Congratulations <span class="highlight">${name}</span>!</p>
            <p>Your application to become a <span class="highlight">Chit Organizer</span> has been <span style="color: #10b981; font-weight: bold;">APPROVED</span> by our administrative team.</p>
            <p>You now have full access to our professional Chit Management Suite, allowing you to:</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <ul style="margin: 0; padding-left: 20px; color: #065f46; font-weight: 500;">
                    <li>Launch and host new Chit Groups</li>
                    <li>Manage member contributions and distributions</li>
                    <li>Conduct automated auctions and dividends</li>
                    <li>Earn management commissions securely</li>
                </ul>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.FRONTEND_URL}/organizer/create-chit" class="button" style="background-color: #10b981;">Create Your First Chit</a>
            </div>
            
            <p>We are excited to see you lead and grow your financial community on <span class="highlight">DigiChit</span>!</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} DigiChit Technologies<br>
            Secure Community Finance Ecosystem.
        </div>
    </div>
</body>
</html>
`;

export const getOrganizerRejectedTemplate = (name: string, reason: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="background-color: #9f1239;">
            <h1 class="logo">Digi<span>Chit</span></h1>
        </div>
        <div class="content">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 20px; background-color: #fff1f2; border-radius: 50%;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                </div>
            </div>
            <h2 style="text-align: center; color: #9f1239;">Organizer Application Update</h2>
            <p>Hello <span class="highlight">${name}</span>,</p>
            <p>Thank you for your interest in becoming a Chit Organizer on DigiChit. After reviewing your professional profile, we are unable to grant organizer privileges at this moment.</p>
            
            <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 24px; margin: 30px 0; border-radius: 12px;">
                <p style="margin: 0; font-weight: 700; color: #9f1239; margin-bottom: 10px;">Feedback from Audit Team:</p>
                <p style="margin: 0; color: #be123c; font-style: italic;">"${reason}"</p>
            </div>
            
            <p>You can still participate in existing Chits and utilize all other member features. If you wish to reapply, please ensure your profile information is accurate and addresses the feedback above.</p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.FRONTEND_URL}/organizer-status" class="button" style="background-color: #e11d48;">Review & Reapply</a>
            </div>
            
            <p>If you have any questions regarding this decision, please feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} DigiChit Technologies<br>
            Secure Community Finance Ecosystem.
        </div>
    </div>
</body>
</html>
`;
export const getContactReplyTemplate = (name: string, originalMessage: string, adminResponse: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>${baseStyles}</style>
</head>
<body>
    <div class="container">
        <div class="header" style="background-color: ${primaryColor};">
            <h1 class="logo">Digi<span>Chit</span></h1>
        </div>
        <div class="content">
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 20px; background-color: #f0f9ff; border-radius: 50%;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                </div>
            </div>
            <h2 style="text-align: center;">Response to your Inquiry</h2>
            <p>Hello <span class="highlight">${name}</span>,</p>
            <p>Thank you for reaching out to <span class="highlight">DigiChit Support</span>. Our team have reviewed your query and here is our response:</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid ${primaryColor}; padding: 24px; margin: 30px 0; border-radius: 12px; border: 1px solid #e2e8f0;">
                <p style="margin: 0; font-weight: 700; color: ${secondaryColor}; margin-bottom: 12px;">Audit/Support Team Reply:</p>
                <p style="margin: 0; color: #334155; line-height: 1.7; white-space: pre-wrap;">${adminResponse}</p>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; font-size: 14px; color: #64748b;">
                <p style="margin: 0; font-weight: 600; margin-bottom: 6px;">Your Original Inquiry:</p>
                <p style="margin: 0; font-style: italic;">"${originalMessage}"</p>
            </div>
            
            <p style="margin-top: 30px;">To experience our full suite of automated Chit features and to chat with our experts in real-time, we invite you to join our growing community.</p>
            
            <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.FRONTEND_URL}/signup" class="button" style="background-color: #10b981;">Create Free Account</a>
            </div>
            
            <p>Best Regards,<br>Team DigiChit Support</p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} DigiChit Technologies<br>
            Secure Community Finance Ecosystem.
        </div>
    </div>
</body>
</html>
`;
