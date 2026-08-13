import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

const APP_NAME = 'DigiChit';

interface RouteTitleConfig {
    pattern: string;
    title: string | ((params: Record<string, string | undefined>) => string);
}

const ROUTE_TITLES: RouteTitleConfig[] = [
    { pattern: '/', title: `${APP_NAME} — Secure Chit Fund Management System` },
    { pattern: '/about-us', title: `About Us | ${APP_NAME}` },
    { pattern: '/contact', title: `Contact Us | ${APP_NAME}` },
    { pattern: '/terms-and-conditions', title: `Terms & Conditions | ${APP_NAME}` },
    { pattern: '/privacy-policy', title: `Privacy Policy | ${APP_NAME}` },
    { pattern: '/disclaimer', title: `Legal Disclaimer | ${APP_NAME}` },
    { pattern: '/login', title: `Login | ${APP_NAME}` },
    { pattern: '/signup', title: `Create Account | ${APP_NAME}` },
    { pattern: '/forgot-password', title: `Forgot Password | ${APP_NAME}` },
    { pattern: '/reset-password', title: `Reset Password | ${APP_NAME}` },
    { pattern: '/verify-email', title: `Verify Email | ${APP_NAME}` },
    { pattern: '/verify-email-info', title: `Email Verification | ${APP_NAME}` },
    { pattern: '/resend-verification', title: `Resend Verification | ${APP_NAME}` },
    { pattern: '/join/:id', title: `Group Invitation | ${APP_NAME}` },
    { pattern: '/kyc/submit', title: `Submit KYC Verification | ${APP_NAME}` },
    { pattern: '/kyc/status', title: `KYC Status | ${APP_NAME}` },
    { pattern: '/dashboard', title: `Dashboard | ${APP_NAME}` },
    { pattern: '/profile', title: `My Profile | ${APP_NAME}` },
    { pattern: '/organizer-status', title: `Organizer Application Status | ${APP_NAME}` },
    { pattern: '/support', title: `Help & Support | ${APP_NAME}` },
    { pattern: '/join-chit', title: `Explore Chit Groups | ${APP_NAME}` },
    { pattern: '/my-chits', title: `My Active Chits | ${APP_NAME}` },
    { pattern: '/chit-details/:id', title: `Chit Group Details | ${APP_NAME}` },
    { pattern: '/chits/:groupId/cycles', title: `Group Cycles & Timeline | ${APP_NAME}` },
    { pattern: '/cycles/:cycleId', title: `Cycle Details | ${APP_NAME}` },
    { pattern: '/cycles/:cycleId/collections', title: `Cycle Collections | ${APP_NAME}` },
    { pattern: '/chits/:groupId/auctions', title: `Group Auctions & Bids | ${APP_NAME}` },
    { pattern: '/auctions/:auctionId', title: `Auction Room | ${APP_NAME}` },
    { pattern: '/auctions/:auctionId/bids', title: `Live Bidding Room | ${APP_NAME}` },
    { pattern: '/my-installments', title: `My Installments | ${APP_NAME}` },
    { pattern: '/chits/:groupId/installments', title: `Group Installments | ${APP_NAME}` },
    { pattern: '/payments', title: `Payment History | ${APP_NAME}` },
    { pattern: '/my-statement', title: `Member Financial Statement | ${APP_NAME}` },
    { pattern: '/organizer/create-chit', title: `Create New Chit Group | ${APP_NAME}` },
    { pattern: '/organizer/my-chits', title: `My Managed Chits | ${APP_NAME}` },
    { pattern: '/organizer/statements', title: `Organizer Financial Statement | ${APP_NAME}` },
    { pattern: '/admin/dashboard', title: `Admin Dashboard | ${APP_NAME}` },
    { pattern: '/admin/kyc', title: `KYC Review Panel | ${APP_NAME}` },
    { pattern: '/admin/organizers', title: `Organizer Applications | ${APP_NAME}` },
    { pattern: '/admin/queries', title: `Support Queries | ${APP_NAME}` }
];

/**
 * Centralized Route Title Handler Component.
 * Automatically updates `document.title` on client-side route navigation.
 */
export const DocumentTitleHandler = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        let matchedTitle: string | null = null;

        for (const config of ROUTE_TITLES) {
            const match = matchPath({ path: config.pattern, end: true }, pathname);
            if (match) {
                matchedTitle = typeof config.title === 'function' ? config.title(match.params) : config.title;
                break;
            }
        }

        document.title = matchedTitle || `Page Not Found | ${APP_NAME}`;
    }, [pathname]);

    return null;
};
