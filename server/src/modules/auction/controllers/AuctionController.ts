import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middlewares/auth.js';
import { AuctionService } from '../services/AuctionService.js';
import { AuctionStatus } from '../models/Auction.js';
import { UserRole } from '../../user/models/User.js';

const auctionService = new AuctionService();

export class AuctionController {
    public static async createAuction(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const auction = await auctionService.createAuction(actorId, actorRole, req.body);

            res.status(201).json({
                success: true,
                message: 'Auction created successfully',
                data: { auction }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async updateAuction(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const auctionId = req.params.id as string;

            const auction = await auctionService.updateAuction(actorId, actorRole, auctionId, req.body);

            res.status(200).json({
                success: true,
                message: 'Auction updated successfully',
                data: { auction }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async updateAuctionStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const auctionId = req.params.id as string;
            const { status, remarks } = req.body;

            const auction = await auctionService.updateAuctionStatus(actorId, actorRole, auctionId, status as AuctionStatus, remarks);

            res.status(200).json({
                success: true,
                message: `Auction status transitioned to ${auction.status}`,
                data: { auction }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async declareWinner(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const auctionId = req.params.id as string;

            const auction = await auctionService.declareWinner(actorId, actorRole, auctionId, req.body);

            res.status(200).json({
                success: true,
                message: 'Auction winner declared successfully',
                data: { auction }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getAuctionById(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const auctionId = req.params.id as string;
            const auction = await auctionService.getAuctionById(auctionId);

            res.status(200).json({
                success: true,
                data: { auction }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getAuctionByCycle(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const cycleId = req.params.cycleId as string;
            const auction = await auctionService.getAuctionByCycle(cycleId);

            res.status(200).json({
                success: true,
                data: { auction }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getAuctionsByGroup(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const groupId = req.params.groupId as string;
            const status = req.query.status as AuctionStatus | undefined;

            const auctions = await auctionService.getAuctionsByGroup(groupId, status);

            res.status(200).json({
                success: true,
                data: { auctions }
            });
        } catch (error) {
            next(error);
        }
    }

    public static async deleteAuction(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const actorId = req.user!.id;
            const actorRole = req.user!.role as UserRole;
            const auctionId = req.params.id as string;

            const result = await auctionService.deleteAuction(actorId, actorRole, auctionId);

            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
