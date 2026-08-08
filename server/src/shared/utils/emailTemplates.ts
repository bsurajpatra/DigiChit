/**
 * DigiChit Premium Email Templates
 * Designed with a modern, high-end fintech aesthetic matching the app's UI.
 * Expanded container width (680px max-width) optimized for laptops and large screens,
 * with fully responsive mobile fallbacks.
 */

const baseStyles = `
    /* Resets & Global Styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        background-color: #f8fafc;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #334155;
        line-height: 1.6;
    }

    /* Container for Laptop / Desktop (680px Wide) */
    .email-container {
        width: 100% !important;
        max-width: 680px !important;
        margin: 0 auto !important;
        background-color: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
    }

    /* Media Queries for Laptops & Mobile */
    @media only screen and (min-width: 600px) {
        .email-container { width: 680px !important; margin: 36px auto !important; }
        .content-padding { padding: 48px 48px !important; }
        .header-padding { padding: 36px 48px !important; }
        .footer-padding { padding: 32px 48px !important; }
        .otp-box { font-size: 36px !important; padding: 22px 36px !important; letter-spacing: 0.4em !important; }
        .hero-title { font-size: 26px !important; }
        .grid-2 { display: table !important; width: 100% !important; }
        .grid-col { display: table-cell !important; width: 50% !important; vertical-align: top; }
    }

    @media only screen and (max-width: 599px) {
        .email-container { width: 100% !important; border-radius: 0 !important; border: none !important; }
        .content-padding { padding: 28px 20px !important; }
        .header-padding { padding: 24px 20px !important; }
        .footer-padding { padding: 24px 20px !important; }
        .otp-box { font-size: 28px !important; padding: 16px 20px !important; letter-spacing: 0.25em !important; }
        .hero-title { font-size: 22px !important; }
    }
`;

/**
 * Shared Header Component matching DigiChit App UI Header
 */
const renderHeader = (badgeText: string = 'SECURE COMMUNITY FINANCE') => `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; background-image: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
        <tr>
            <td class="header-padding" style="padding: 32px 36px; text-align: center;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                        <td align="center">
                            <!-- Logo Brand Mark -->
                            <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                                <span style="font-family: 'Inter', system-ui, sans-serif; font-size: 30px; font-weight: 900; letter-spacing: -0.03em; color: #ffffff; text-decoration: none;">
                                    Digi<span style="color: #10b981;">Chit</span>
                                </span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding-top: 12px;">
                            <!-- Security Badge -->
                            <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.12); color: #34d399; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.25);">
                                🛡️ ${badgeText}
                            </span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
`;

/**
 * Shared Footer Component matching DigiChit App UI Footer
 */
const renderFooter = () => `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-top: 1px solid #f1f5f9;">
        <tr>
            <td class="footer-padding" style="padding: 32px 36px; text-align: center;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.12em;">
                    DigiChit Technologies
                </p>
                <p style="margin: 0 0 16px 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                    Automated, Encrypted & Transparent Community Finance Platform
                </p>
                <div style="display: inline-block; background-color: #ffffff; padding: 8px 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                    <span style="font-size: 11px; font-weight: 700; color: #059669;">🔒 256-Bit Encrypted & Audited System</span>
                </div>
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                    &copy; ${new Date().getFullYear()} DigiChit Inc. All rights reserved. • <a href="${process.env.FRONTEND_URL || '#'}/privacy-policy" style="color: #64748b; text-decoration: underline;">Privacy Policy</a>
                </p>
            </td>
        </tr>
    </table>
`;

/**
 * 1. Email Verification / OTP Template
 */
export const getVerificationTemplate = (link: string, otp?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your DigiChit Account</title>
    <style>${baseStyles}</style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc;">
        <tr>
            <td align="center">
                <div class="email-container">
                    ${renderHeader('IDENTITY VERIFICATION')}
                    
                    <!-- Content -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="content-padding" style="padding: 40px 36px;">
                                <h2 class="hero-title" style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.02em;">
                                    Verify your Email & Account
                                </h2>
                                <p style="font-size: 15px; color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
                                    Welcome to <strong style="color: #0f172a;">DigiChit</strong>, the leading transparent community finance platform. Please verify your email to complete your registration.
                                </p>

                                ${otp ? `
                                <!-- High-Visibility OTP Block -->
                                <div style="background-color: #f0fdf4; border: 2px dashed #059669; border-radius: 18px; padding: 24px 20px; text-align: center; margin: 28px 0;">
                                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #047857; margin-bottom: 8px;">
                                        Your One-Time Security Code (OTP)
                                    </span>
                                    <div class="otp-box" style="font-family: 'Segoe UI', Monaco, monospace; font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: 0.35em; padding-left: 0.35em; display: inline-block;">
                                        ${otp}
                                    </div>
                                    <span style="display: block; font-size: 12px; font-weight: 700; color: #059669; margin-top: 10px;">
                                        ⏱ Valid for 15 minutes • Do not share with anyone
                                    </span>
                                </div>
                                ` : ''}

                                <p style="font-size: 15px; color: #475569; margin: 0 0 28px 0;">
                                    Click the button below to instantly verify your email address:
                                </p>

                                <!-- Primary Button -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="${link}" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3);">
                                                Verify Email Address &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Info Callout Box -->
                                <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 18px 20px; border-radius: 0 12px 12px 0; margin-top: 28px;">
                                    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                                        <strong style="color: #0f172a;">Security Note:</strong> This link is valid for <span style="color: #059669; font-weight: 700;">15 minutes</span>. If you did not create an account on DigiChit, you can safely ignore this email.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </table>

                    ${renderFooter()}
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * 2. Dedicated OTP Email Template
 */
export const getOTPTemplate = (otp: string, name?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your DigiChit One-Time Passcode</title>
    <style>${baseStyles}</style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <div class="email-container">
                    ${renderHeader('ONE-TIME PASSCODE (OTP)')}
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="content-padding" style="padding: 40px 36px;">
                                <h2 class="hero-title" style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.02em;">
                                    Security Verification Code
                                </h2>
                                <p style="font-size: 15px; color: #475569; margin: 0 0 20px 0;">
                                    Hello ${name ? `<strong style="color: #0f172a;">${name}</strong>` : 'Member'}, use the following One-Time Passcode (OTP) to authenticate your request on <strong style="color: #0f172a;">DigiChit</strong>:
                                </p>

                                <!-- Prominent Laptop-Optimized OTP Box -->
                                <div style="background-color: #f0fdf4; border: 2px dashed #059669; border-radius: 20px; padding: 28px 24px; text-align: center; margin: 32px 0;">
                                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #047857; margin-bottom: 10px;">
                                        Your 6-Digit Passcode
                                    </span>
                                    <div class="otp-box" style="font-family: 'Segoe UI', Monaco, monospace; font-size: 38px; font-weight: 900; color: #0f172a; letter-spacing: 0.4em; padding-left: 0.4em; display: inline-block;">
                                        ${otp}
                                    </div>
                                    <div style="margin-top: 14px; display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 4px 14px; border-radius: 12px;">
                                        ⏱ Valid for 10 minutes
                                    </div>
                                </div>

                                <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 18px 20px; border-radius: 14px; margin-top: 24px;">
                                    <p style="margin: 0; font-size: 13px; color: #9f1239; line-height: 1.5;">
                                        <strong>⚠️ Do not share this code:</strong> DigiChit staff will never ask for your OTP or password over phone, email, or chat.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </table>

                    ${renderFooter()}
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * 3. Welcome Email Template
 */
export const getWelcomeTemplate = (name: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to DigiChit!</title>
    <style>${baseStyles}</style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <div class="email-container">
                    ${renderHeader('WELCOME TO THE CIRCLE')}
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="content-padding" style="padding: 40px 36px;">
                                <!-- Celebratory Icon Badge -->
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <span style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 14px 28px; border-radius: 30px; color: #047857; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em;">
                                        🎉 Account Verified & Ready
                                    </span>
                                </div>

                                <h2 class="hero-title" style="color: #0f172a; font-size: 26px; font-weight: 800; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.02em;">
                                    Welcome to DigiChit, ${name}!
                                </h2>
                                <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0; text-align: center; line-height: 1.6;">
                                    Your email address has been verified. You are now officially part of <strong style="color: #0f172a;">DigiChit</strong> — India's premier transparent & secure financial chit circle platform.
                                </p>

                                <!-- Actionable Steps Cards (App UI Style) -->
                                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; margin: 28px 0;">
                                    <h3 style="margin: 0 0 20px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #0f172a;">
                                        🚀 Next Steps to Unlock Full Features:
                                    </h3>
                                    
                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                                        <tr>
                                            <td width="36" valign="top">
                                                <div style="background-color: #0f172a; color: #10b981; font-size: 12px; font-weight: 900; width: 28px; height: 28px; border-radius: 8px; text-align: center; line-height: 28px;">1</div>
                                            </td>
                                            <td valign="top" style="padding-left: 12px;">
                                                <strong style="color: #0f172a; font-size: 14px;">Complete KYC Verification</strong>
                                                <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">Verify your identity with Aadhaar to start bidding or creating chit circles.</p>
                                            </td>
                                        </tr>
                                    </table>

                                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                                        <tr>
                                            <td width="36" valign="top">
                                                <div style="background-color: #0f172a; color: #10b981; font-size: 12px; font-weight: 900; width: 28px; height: 28px; border-radius: 8px; text-align: center; line-height: 28px;">2</div>
                                            </td>
                                            <td valign="top" style="padding-left: 12px;">
                                                <strong style="color: #0f172a; font-size: 14px;">Browse Verified Chit Circles</strong>
                                                <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">Explore active circles tailored to your financial savings & investment goals.</p>
                                            </td>
                                        </tr>
                                    </table>

                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td width="36" valign="top">
                                                <div style="background-color: #0f172a; color: #10b981; font-size: 12px; font-weight: 900; width: 28px; height: 28px; border-radius: 8px; text-align: center; line-height: 28px;">3</div>
                                            </td>
                                            <td valign="top" style="padding-left: 12px;">
                                                <strong style="color: #0f172a; font-size: 14px;">Apply for Organizer Privileges</strong>
                                                <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">Host your own financial circles and manage dividends with full transparency.</p>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <!-- CTA Button -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 16px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; box-shadow: 0 10px 20px -5px rgba(5, 150, 105, 0.3);">
                                                Go to Your Dashboard &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    ${renderFooter()}
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * 4. Password Reset Template
 */
export const getPasswordResetTemplate = (link: string, otp?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your DigiChit Password</title>
    <style>${baseStyles}</style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <div class="email-container">
                    ${renderHeader('PASSWORD RECOVERY')}
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="content-padding" style="padding: 40px 36px;">
                                <h2 class="hero-title" style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px 0;">
                                    Reset Password Request
                                </h2>
                                <p style="font-size: 15px; color: #475569; margin: 0 0 20px 0;">
                                    We received a request to reset the password for your <strong style="color: #0f172a;">DigiChit</strong> account.
                                </p>

                                ${otp ? `
                                <div style="background-color: #f8fafc; border: 2px dashed #64748b; border-radius: 18px; padding: 24px 20px; text-align: center; margin: 28px 0;">
                                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #475569; margin-bottom: 8px;">
                                        Reset Security Code (OTP)
                                    </span>
                                    <div class="otp-box" style="font-family: 'Segoe UI', Monaco, monospace; font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: 0.35em; padding-left: 0.35em; display: inline-block;">
                                        ${otp}
                                    </div>
                                </div>
                                ` : ''}

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="${link}" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em;">
                                                Reset Password Now &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 18px 20px; border-radius: 14px; margin-top: 28px;">
                                    <p style="margin: 0; font-size: 13px; color: #9f1239; line-height: 1.5;">
                                        <strong>Notice:</strong> This link is valid for <span style="font-weight: 700;">1 hour</span>. If you did not initiate this request, please change your password immediately or contact support.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </table>

                    ${renderFooter()}
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * 5. KYC Approved Template
 */
export const getKYCApprovedTemplate = (name: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KYC Verified</title>
    <style>${baseStyles}</style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <div class="email-container">
                    ${renderHeader('KYC VERIFICATION APPROVED')}
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="content-padding" style="padding: 40px 36px;">
                                <div style="text-align: center; margin-bottom: 24px;">
                                    <div style="display: inline-block; width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%; text-align: center; line-height: 64px;">
                                        <span style="font-size: 32px;">✅</span>
                                    </div>
                                </div>

                                <h2 class="hero-title" style="color: #0f172a; font-size: 24px; font-weight: 800; text-align: center; margin: 0 0 16px 0;">
                                    Identity Verified, ${name}!
                                </h2>
                                <p style="font-size: 15px; color: #475569; text-align: center; margin: 0 0 28px 0; line-height: 1.6;">
                                    Your KYC documents have been reviewed and <strong style="color: #059669;">APPROVED</strong> by our compliance team. Your account is now fully active.
                                </p>

                                <div style="background-color: #f0fdf4; border-left: 4px solid #059669; padding: 20px; border-radius: 0 14px 14px 0; margin-bottom: 28px;">
                                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; text-transform: uppercase; color: #065f46;">Unlocked Capabilities:</p>
                                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #166534; line-height: 1.7;">
                                        <li>Join active financial chit groups</li>
                                        <li>Participate in monthly competitive auctions</li>
                                        <li>Apply to organize and manage chit groups</li>
                                    </ul>
                                </div>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em;">
                                                Access Full Platform Features &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    ${renderFooter()}
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * 6. KYC Rejected Template
 */
export const getKYCRejectedTemplate = (name: string, reason: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KYC Action Required</title>
    <style>${baseStyles}</style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <div class="email-container">
                    ${renderHeader('KYC AUDIT FEEDBACK')}
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="content-padding" style="padding: 40px 36px;">
                                <h2 class="hero-title" style="color: #9f1239; font-size: 24px; font-weight: 800; margin: 0 0 16px 0;">
                                    KYC Action Required
                                </h2>
                                <p style="font-size: 15px; color: #475569; margin: 0 0 20px 0;">
                                    Hello <strong style="color: #0f172a;">${name}</strong>, your recent KYC submission requires correction before it can be approved.
                                </p>

                                <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 24px; margin: 28px 0;">
                                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.15em; color: #9f1239; margin-bottom: 8px;">
                                        Audit Reason / Remarks:
                                    </span>
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #be123c; font-style: italic;">
                                        "${reason}"
                                    </p>
                                </div>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="${process.env.FRONTEND_URL}/kyc/submit" style="display: inline-block; background-color: #e11d48; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em;">
                                                Resubmit KYC Documents &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    ${renderFooter()}
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * 7. Organizer Approved Template
 */
export const getOrganizerApprovedTemplate = (name: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organizer Privileges Granted</title>
    <style>${baseStyles}</style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <div class="email-container">
                    ${renderHeader('ORGANIZER ROLE APPROVED')}
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="content-padding" style="padding: 40px 36px;">
                                <h2 class="hero-title" style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px 0;">
                                    Congratulations, Organizer ${name}!
                                </h2>
                                <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0; line-height: 1.6;">
                                    Your application for <strong style="color: #0f172a;">Chit Organizer Privileges</strong> has been reviewed and <strong style="color: #059669;">APPROVED</strong> by our administrative council.
                                </p>

                                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; margin: 28px 0;">
                                    <strong style="display: block; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #065f46; margin-bottom: 12px;">Your Organizer Capabilities:</strong>
                                    <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #166534; line-height: 1.7;">
                                        <li>Create & configure financial chit groups (2–50 members)</li>
                                        <li>Manage member approvals & automated monthly auctions</li>
                                        <li>Earn transparent management commission (up to 5%)</li>
                                    </ul>
                                </div>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="${process.env.FRONTEND_URL}/organizer/create-chit" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em;">
                                                Create Your First Chit Circle &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    ${renderFooter()}
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * 8. Organizer Rejected Template
 */
export const getOrganizerRejectedTemplate = (name: string, reason: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organizer Application Update</title>
    <style>${baseStyles}</style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <div class="email-container">
                    ${renderHeader('ORGANIZER APPLICATION FEEDBACK')}
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="content-padding" style="padding: 40px 36px;">
                                <h2 class="hero-title" style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px 0;">
                                    Organizer Application Status
                                </h2>
                                <p style="font-size: 15px; color: #475569; margin: 0 0 20px 0;">
                                    Hello <strong style="color: #0f172a;">${name}</strong>, thank you for applying for organizer privileges. Our team was unable to approve your application at this time.
                                </p>

                                <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 24px; margin: 28px 0;">
                                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #9f1239; margin-bottom: 8px;">Audit Council Remarks:</span>
                                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #be123c; font-style: italic;">
                                        "${reason}"
                                    </p>
                                </div>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="${process.env.FRONTEND_URL}/organizer-status" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em;">
                                                Review & Reapply &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    ${renderFooter()}
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * 9. Support Inquiry Reply Template
 */
export const getContactReplyTemplate = (name: string, originalMessage: string, adminResponse: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Update on your DigiChit Inquiry</title>
    <style>${baseStyles}</style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <div class="email-container">
                    ${renderHeader('SUPPORT DESK RESPONSE')}
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="content-padding" style="padding: 40px 36px;">
                                <h2 class="hero-title" style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px 0;">
                                    Response to your Inquiry
                                </h2>
                                <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0;">
                                    Hello <strong style="color: #0f172a;">${name}</strong>, our support team has responded to your inquiry:
                                </p>

                                <div style="background-color: #f8fafc; border-left: 4px solid #0f172a; border-radius: 0 14px 14px 0; padding: 24px; margin: 28px 0; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a; margin-bottom: 10px;">Support Officer Reply:</span>
                                    <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-wrap;">${adminResponse}</p>
                                </div>

                                <div style="background-color: #f1f5f9; border-radius: 14px; padding: 20px; margin-bottom: 28px;">
                                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Your Original Inquiry:</span>
                                    <p style="margin: 0; font-size: 13px; color: #475569; font-style: italic;">"${originalMessage}"</p>
                                </div>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em;">
                                                Go to Support Dashboard &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    ${renderFooter()}
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;

/**
 * 10. Chit Group Created Template
 */
export const getChitGroupCreatedTemplate = (name: string, groupName: string, contribution: number, members: number, startDate: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chit Circle Established</title>
    <style>${baseStyles}</style>
</head>
<body style="background-color: #f8fafc; margin: 0; padding: 20px 0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <div class="email-container">
                    ${renderHeader('FINANCIAL CIRCLE CREATED')}
                    
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td class="content-padding" style="padding: 40px 36px;">
                                <h2 class="hero-title" style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px 0;">
                                    Circle Established: ${groupName}
                                </h2>
                                <p style="font-size: 15px; color: #475569; margin: 0 0 24px 0;">
                                    Hello <strong style="color: #0f172a;">${name}</strong>, your new financial chit group <strong style="color: #059669;">"${groupName}"</strong> is now live in the formation phase.
                                </p>

                                <!-- Specs Grid -->
                                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 20px; padding: 24px; margin: 28px 0;">
                                    <span style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #0f172a; margin-bottom: 16px;">
                                        Circle Specifications:
                                    </span>

                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td width="50%" style="padding-bottom: 14px;">
                                                <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Monthly Contribution</span>
                                                <strong style="font-size: 18px; color: #0f172a;">₹${contribution.toLocaleString()}</strong>
                                            </td>
                                            <td width="50%" style="padding-bottom: 14px;">
                                                <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Members</span>
                                                <strong style="font-size: 18px; color: #0f172a;">${members} Seats</strong>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td width="50%">
                                                <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Pot Yield</span>
                                                <strong style="font-size: 18px; color: #059669;">₹${(contribution * members).toLocaleString()}</strong>
                                            </td>
                                            <td width="50%">
                                                <span style="display: block; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Start Date</span>
                                                <strong style="font-size: 18px; color: #0f172a;">${startDate}</strong>
                                            </td>
                                        </tr>
                                    </table>
                                </div>

                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                    <tr>
                                        <td align="center">
                                            <a href="${process.env.FRONTEND_URL}/organizer/my-chits" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em;">
                                                Manage Organized Circles &rarr;
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    ${renderFooter()}
                </div>
            </td>
        </tr>
    </table>
</body>
</html>
`;
