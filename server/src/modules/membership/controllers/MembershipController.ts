import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../auth/middlewares/auth.js';
import { MembershipService } from '../services/MembershipService.js';

const membershipService = new MembershipService();

export class MembershipController {
    public static async getMyMemberships(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const memberships = await membershipService.getMyMemberships(req.user!.id);
            res.status(200).json({ success: true, data: { memberships } });
        } catch (error) {
            next(error);
        }
    }

    public static async getGroupMembers(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groupId = req.params.groupId as string;
            const members = await membershipService.getGroupMembers(groupId);
            res.status(200).json({ success: true, data: { members } });
        } catch (error) {
            next(error);
        }
    }

    public static async approveMember(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const membershipId = req.params.membershipId as string;
            const membership = await membershipService.approveMember({
                organizerId: req.user!.id,
                membershipId
            });
            res.status(200).json({ success: true, data: { membership } });
        } catch (error) {
            next(error);
        }
    }

    public static async rejectMember(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const membershipId = req.params.membershipId as string;
            const membership = await membershipService.rejectMember({
                organizerId: req.user!.id,
                membershipId
            });
            res.status(200).json({ success: true, data: { membership } });
        } catch (error) {
            next(error);
        }
    }
}
