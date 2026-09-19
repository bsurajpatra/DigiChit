import {
    UserCheck, Briefcase, UserCircle,
    PlusCircle, FolderKanban, Search, Wallet, ShieldPlus, ShieldAlert, Inbox, MessageSquare, CreditCard, FileText
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type MenuItem = {
    label: string;
    path: string;
    icon: LucideIcon;
    badge?: string | number;
    subItems?: MenuItem[];
};

export const getSidebarMenu = (role: string, organizerStatus: string, kycStatus?: string, pendingDuesCount?: number): MenuItem[] => {
    if (role === 'ADMIN') {
        return [
            { label: 'KYC Approvals', path: '/admin/kyc', icon: UserCheck },
            { label: 'Organizer Apps', path: '/admin/organizers', icon: Briefcase },
            { label: 'Inquiry Inbox', path: '/admin/queries', icon: Inbox },
            { label: 'Payments', path: '/payments', icon: CreditCard },
            { label: 'Profile Settings', path: '/profile', icon: UserCircle },
        ];
    }

    // Common for both USER and ORGANIZER
    const baseItems: MenuItem[] = [];

    if (kycStatus === 'REJECTED') {
        baseItems.push({ label: 'Fix ID Issue', path: '/kyc/status', icon: ShieldAlert });
    } else if (kycStatus === 'NOT_SUBMITTED') {
        baseItems.push({ label: 'Verify Identity', path: '/kyc/status', icon: UserCheck });
    }

    const supportItem: MenuItem = { label: 'Support & Help', path: '/support', icon: MessageSquare };
    const paymentsItem: MenuItem = { 
        label: 'Payments', 
        path: '/payments', 
        icon: CreditCard,
        badge: pendingDuesCount && pendingDuesCount > 0 ? pendingDuesCount : undefined
    };
    const memberStatementItem: MenuItem = { label: 'My Statement', path: '/my-statement', icon: FileText };

    if (role === 'ORGANIZER') {
        return [
            { 
                label: 'Chits', 
                path: '#chits', 
                icon: Wallet,
                subItems: [
                    { label: 'Create Chit', path: '/organizer/create-chit', icon: PlusCircle },
                    { label: 'My Organized Chits', path: '/organizer/my-chits', icon: FolderKanban },
                    { label: 'Join Chit', path: '/join-chit', icon: Search },
                    { label: 'My Subscribed Chits', path: '/my-chits', icon: Wallet },
                ]
            },
            ...baseItems,
            paymentsItem,
            {
                label: 'Statements',
                path: '#statements',
                icon: FileText,
                subItems: [
                    { label: 'My Statement', path: '/my-statement', icon: FileText },
                    { label: 'Circle Statements', path: '/organizer/statements', icon: FileText },
                ]
            },
            { label: 'Profile Settings', path: '/profile', icon: UserCircle },
            supportItem
        ];
    }

    // Default to USER (Member)
    const chitsSubItems: MenuItem[] = [
        { label: 'Join Chit', path: '/join-chit', icon: Search },
        { label: 'My Chits', path: '/my-chits', icon: Wallet },
    ];

    const baseMenu: MenuItem[] = [
        { label: 'Chits', path: '#chits', icon: Wallet, subItems: chitsSubItems },
        ...baseItems
    ];

    if (organizerStatus === 'NOT_APPLIED') {
        baseMenu.push({ label: 'Become Organizer', path: '/organizer-status', icon: ShieldPlus });
    } else if (organizerStatus === 'PENDING') {
        baseMenu.push({ label: 'Organizer Status', path: '/organizer-status', icon: ShieldAlert });
    } else if (organizerStatus === 'REJECTED') {
        baseMenu.push({ label: 'Reapply Organizer', path: '/organizer-status', icon: ShieldAlert });
    }

    baseMenu.push(paymentsItem);
    baseMenu.push(memberStatementItem);
    baseMenu.push({ label: 'Profile Settings', path: '/profile', icon: UserCircle });
    baseMenu.push(supportItem);

    return baseMenu;
};
