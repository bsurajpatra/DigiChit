import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as bidService from '../services/bid.service.js';
import { UserRole } from '../models/User.js';

/**
 * Controller to submit a new bid during an OPEN auction.
 * POST /api/bids
 */
export const submitBid = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to update an existing bid during an OPEN auction.
 * PATCH /api/bids/:id
 */
export const updateBid = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to withdraw a bid while the auction is OPEN.
 * DELETE /api/bids/:id
 */
export const withdrawBid = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to get bid details by ID.
 * GET /api/bids/:id
 */
export const getBidById = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to get all bids for a specific auction.
 * GET /api/bids/auction/:auctionId
 */
export const getBidsByAuction = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to get all bids placed by a specific member.
 * GET /api/bids/member/:membershipId
 */
export const getBidsByMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};
