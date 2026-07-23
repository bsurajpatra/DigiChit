import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as installmentService from '../services/installment.service.js';
import { PaymentStatus } from '../models/Installment.js';
import { UserRole } from '../models/User.js';

/**
 * Controller to bulk generate installments for a ChitCycle.
 * POST /api/installments/generate/:cycleId
 */
export const generateInstallments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const cycleId = req.params.cycleId as string;
        const { dueDate } = req.body;

        const result = await installmentService.generateInstallmentsForCycle(actorId, actorRole, cycleId, dueDate);

        res.status(201).json({
            success: true,
            message: `Generated ${result.createdCount} installment(s). (${result.existingCount} already existed).`,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to update payment status (PAID, PARTIALLY_PAID, WAIVED, OVERDUE).
 * PATCH /api/installments/:id/status
 */
export const updateInstallmentStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const installmentId = req.params.id as string;

        const installment = await installmentService.updateInstallmentStatus(actorId, actorRole, installmentId, req.body);

        res.status(200).json({
            success: true,
            message: `Installment payment status updated to ${installment.paymentStatus}`,
            data: { installment }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to update installment details (amount, dueDate, lateFee, remarks).
 * PATCH /api/installments/:id
 */
export const updateInstallment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const installmentId = req.params.id as string;

        const installment = await installmentService.updateInstallment(actorId, actorRole, installmentId, req.body);

        res.status(200).json({
            success: true,
            message: 'Installment updated successfully',
            data: { installment }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to get installment details by ID.
 * GET /api/installments/:id
 */
export const getInstallmentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const installmentId = req.params.id as string;

        const installment = await installmentService.getInstallmentById(actorId, actorRole, installmentId);

        res.status(200).json({
            success: true,
            data: { installment }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch all installments for a specific cycle.
 * GET /api/installments/cycle/:cycleId
 */
export const getInstallmentsByCycle = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const cycleId = req.params.cycleId as string;
        const status = req.query.status as PaymentStatus | undefined;

        const installments = await installmentService.getInstallmentsByCycle(actorId, actorRole, cycleId, status);

        res.status(200).json({
            success: true,
            data: { installments }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch all installments for a specific member.
 * GET /api/installments/member/:membershipId
 */
export const getInstallmentsByMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const membershipId = req.params.membershipId as string;

        const installments = await installmentService.getInstallmentsByMember(actorId, actorRole, membershipId);

        res.status(200).json({
            success: true,
            data: { installments }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch all installments for a Chit Group.
 * GET /api/installments/group/:groupId
 */
export const getInstallmentsByGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const actorId = req.user!.id;
        const actorRole = req.user!.role as UserRole;
        const groupId = req.params.groupId as string;
        const status = req.query.status as PaymentStatus | undefined;

        const installments = await installmentService.getInstallmentsByGroup(actorId, actorRole, groupId, status);

        res.status(200).json({
            success: true,
            data: { installments }
        });
    } catch (error) {
        next(error);
    }
};
