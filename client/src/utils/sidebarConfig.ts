import {
    UserCheck, Briefcase, UserCircle,
    PlusCircle, FolderKanban, Search, Wallet, ShieldPlus, ShieldAlert
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type MenuItem = {
    label: string;
    path: string;
    icon: LucideIcon;
    subItems?: MenuItem[];
};

export const getSidebarMenu = (role: string, organizerStatus: string): MenuItem[] => {
    if (role === 'ADMIN') {
        return [
            { label: 'KYC Approvals', path: '/admin/kyc', icon: UserCheck },
            { label: 'Organizer Apps', path: '/admin/organizers', icon: Briefcase },
            { label: 'Profile', path: '/profile', icon: UserCircle },
        ];
    }

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
                    { label: 'My Chits', path: '/dashboard', icon: Wallet },
                ]
            },
            { label: 'Profile', path: '/profile', icon: UserCircle },
        ];
    }

    // Default to USER
    const chitsSubItems: MenuItem[] = [
        { label: 'Join Chit', path: '/join-chit', icon: Search },
        { label: 'My Chits', path: '/my-chits', icon: Wallet },
    ];

    const baseMenu: MenuItem[] = [
        { label: 'Chits', path: '#chits', icon: Wallet, subItems: chitsSubItems },
    ];

    if (organizerStatus === 'NOT_APPLIED') {
        baseMenu.push({ label: 'Become Organizer', path: '/organizer-status', icon: ShieldPlus });
    } else if (organizerStatus === 'PENDING') {
        baseMenu.push({ label: 'Organizer Status', path: '/organizer-status', icon: ShieldAlert });
    } else if (organizerStatus === 'REJECTED') {
        baseMenu.push({ label: 'Reapply Organizer', path: '/organizer-status', icon: ShieldAlert });
    }

    baseMenu.push({ label: 'Profile', path: '/profile', icon: UserCircle });

    return baseMenu;
};
