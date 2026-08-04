import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/auth.js';
import { BidService } from '../services/BidService.js';
import { UserRole } from '../../user/models/User.js';

const bidService = new BidService();

export class BidController {
    public static async submitBid(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const ipAddress = req.ip || req.socket.remoteAddress;

            const bid = await bidService.submitBid(actorId, actorRole, req.body, ipAddress);

            res.status(201).json({
                success: true,
                message: 'Bid submitted successfully',
                data: { bid }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async updateBid(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const bidId = req.params.id as string;

            const bid = await bidService.updateBid(actorId, actorRole, bidId, req.body);

            res.status(200).json({
                success: true,
                message: 'Bid updated successfully',
                data: { bid }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async withdrawBid(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const bidId = req.params.id as string;

            const bid = await bidService.withdrawBid(actorId, actorRole, bidId);

            res.status(200).json({
                success: true,
                message: 'Bid withdrawn successfully',
                data: { bid }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getBidById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const bidId = req.params.id as string;

            const bid = await bidService.getBidById(actorId, actorRole, bidId);

            res.status(200).json({
                success: true,
                data: { bid }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getBidsByAuction(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const auctionId = req.params.auctionId as string;

            const bids = await bidService.getBidsByAuction(actorId, actorRole, auctionId);

            res.status(200).json({
                success: true,
                data: { bids }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getBidsByMember(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const membershipId = req.params.membershipId as string;

            const bids = await bidService.getBidsByMember(actorId, actorRole, membershipId);

            res.status(200).json({
                success: true,
                data: { bids }
            });
        } catch (error) {
            next(error);
        }
    }
}
