import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as chitCycleService from '../services/chitCycle.service.js';
import { ChitCycleStatus } from '../models/ChitCycle.js';
import { UserRole } from '../models/User.js';

/**
 * Controller to create the next sequential ChitCycle for a group.
 * POST /api/chit-cycles
 */
export const createCycle = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const cycle = await chitCycleService.createCycle(actorId, actorRole, req.body);

        res.status(201).json({
            success: true,
            message: `Cycle ${cycle.cycleNumber} created successfully`,
            data: { cycle }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to start/activate an UPCOMING cycle.
 * PATCH /api/chit-cycles/:id/start
 */
export const startCycle = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const { actualStartDate } = req.body;
        const cycleId = req.params.id as string;

        const cycle = await chitCycleService.startCycle(actorId, actorRole, cycleId, actualStartDate);

        res.status(200).json({
            success: true,
            message: `Cycle ${cycle.cycleNumber} is now ACTIVE`,
            data: { cycle }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to complete an ACTIVE cycle.
 * PATCH /api/chit-cycles/:id/complete
 */
export const completeCycle = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const { actualEndDate } = req.body;
        const cycleId = req.params.id as string;

        const cycle = await chitCycleService.completeCycle(actorId, actorRole, cycleId, actualEndDate);

        res.status(200).json({
            success: true,
            message: `Cycle ${cycle.cycleNumber} is now COMPLETED`,
            data: { cycle }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to cancel a cycle.
 * PATCH /api/chit-cycles/:id/cancel
 */
export const cancelCycle = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const { remarks } = req.body;
        const cycleId = req.params.id as string;

        const cycle = await chitCycleService.cancelCycle(actorId, actorRole, cycleId, remarks);

        res.status(200).json({
            success: true,
            message: `Cycle ${cycle.cycleNumber} has been CANCELLED`,
            data: { cycle }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to record winner details for an active cycle.
 * PATCH /api/chit-cycles/:id/winner
 */
export const recordWinner = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const cycleId = req.params.id as string;

        const cycle = await chitCycleService.recordWinner(actorId, actorRole, cycleId, req.body);

        res.status(200).json({
            success: true,
            message: `Winner recorded successfully for Cycle ${cycle.cycleNumber}`,
            data: { cycle }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch all cycles for a specific Chit Group.
 * GET /api/chit-cycles/group/:groupId
 */
export const getCyclesByGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const groupId = req.params.groupId as string;
        const status = req.query.status as ChitCycleStatus | undefined;

        const cycles = await chitCycleService.getCyclesByGroup(groupId, status);

        res.status(200).json({
            success: true,
            data: { cycles }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch the current ACTIVE cycle for a specific group.
 * GET /api/chit-cycles/group/:groupId/active
 */
export const getActiveCycle = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const groupId = req.params.groupId as string;
        const cycle = await chitCycleService.getActiveCycle(groupId);

        res.status(200).json({
            success: true,
            data: { cycle }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch details of a specific cycle by ID.
 * GET /api/chit-cycles/:id
 */
export const getCycleDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const cycleId = req.params.id as string;
        const cycle = await chitCycleService.getCycleById(cycleId);

        res.status(200).json({
            success: true,
            data: { cycle }
        });
    } catch (error) {
        next(error);
    }
};
