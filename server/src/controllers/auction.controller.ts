import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as auctionService from '../services/auction.service.js';
import { AuctionStatus } from '../models/Auction.js';
import { UserRole } from '../models/User.js';

/**
 * Controller to create an auction for a ChitCycle.
 * POST /api/auctions
 */
export const createAuction = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to update schedule/metadata of an auction.
 * PUT /api/auctions/:id
 */
export const updateAuction = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to handle auction lifecycle state transitions.
 * PATCH /api/auctions/:id/status
 */
export const updateAuctionStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to declare auction winner.
 * PATCH /api/auctions/:id/declare-winner
 */
export const declareWinner = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to fetch auction by ID.
 * GET /api/auctions/:id
 */
export const getAuctionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to fetch auction by cycleId.
 * GET /api/auctions/cycle/:cycleId
 */
export const getAuctionByCycle = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to fetch all auctions for a Chit Group.
 * GET /api/auctions/group/:groupId
 */
export const getAuctionsByGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
};

/**
 * Controller to soft delete an auction.
 * DELETE /api/auctions/:id
 */
export const deleteAuction = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const auctionId = req.params.id as string;

        const result = await auctionService.deleteAuction(actorId, actorRole, auctionId);

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
