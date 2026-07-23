import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import * as chitGroupService from '../services/chitGroup.service.js';
import ChitGroup, { ChitGroupStatus } from '../models/ChitGroup.js';
import Membership from '../models/Membership.js';
import { AppError } from '../utils/appError.js';

export const createChitGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const chitGroup = await chitGroupService.createChitGroup(req.user!.id, req.body);
        res.status(201).json({ success: true, data: { chitGroup } });
    } catch (error) {
        next(error);
    }
};

export const updateChitGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
        const chitGroup = await chitGroupService.updateChitGroup(
            req.user!.id,
            req.user!.role,
            req.params.id as string,
            req.body,
            clientIp
        );
        res.status(200).json({ success: true, data: { chitGroup } });
    } catch (error) {
        next(error);
    }
};

export const getChitGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const filters: any = { 
            status: ChitGroupStatus.FORMING,
            organizerId: { $ne: req.user!.id }
        };
        // Potentially allow filtering by name, contrib, etc.
        const groups = await ChitGroup.find(filters).populate('organizerId', 'name email');
        res.status(200).json({ success: true, data: { groups } });
    } catch (error) {
        next(error);
    }
};

export const getChitGroupDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const group = await ChitGroup.findById(req.params.id as string).populate('organizerId', 'name email');
        if (!group) return next(new AppError('Group not found.', 404));

        const members = await Membership.find({ chitGroupId: group._id }).populate('userId', 'name email');

        res.status(200).json({ success: true, data: { group, members } });
    } catch (error) {
        next(error);
    }
};

export const requestJoin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const membership = await chitGroupService.requestJoin(req.user!.id, req.params.id as string);
        res.status(201).json({ success: true, data: { membership } });
    } catch (error) {
        next(error);
    }
};

export const approveMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const membership = await chitGroupService.approveMember(req.user!.id, req.params.membershipId as string);
        res.status(200).json({ success: true, data: { membership } });
    } catch (error) {
        next(error);
    }
};

export const rejectMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const membership = await chitGroupService.rejectMember(req.user!.id, req.params.membershipId as string);
        res.status(200).json({ success: true, data: { membership } });
    } catch (error) {
        next(error);
    }
};

export const getMyMemberships = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const memberships = await Membership.find({ userId: req.user!.id }).populate('chitGroupId');
        res.status(200).json({ success: true, data: { memberships } });
    } catch (error) {
        next(error);
    }
};

export const getOrganizerGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const groups = await ChitGroup.find({ organizerId: req.user!.id });
        res.status(200).json({ success: true, data: { groups } });
    } catch (error) {
        next(error);
    }
};

export const manualAddMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const membership = await chitGroupService.manualAddMember(req.user!.id, req.params.id as string, email);
        res.status(201).json({ success: true, data: { membership } });
    } catch (error) {
        next(error);
    }
};
