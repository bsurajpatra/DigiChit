import mongoose from 'mongoose';
import ContactQuery, { IContactQuery } from '../models/ContactQuery.js';

export class SupportRepository {
    /**
     * Creates a new ContactQuery document.
     */
    public async create(data: Partial<IContactQuery>): Promise<IContactQuery> {
        return await ContactQuery.create(data);
    }

    /**
     * Finds a single ContactQuery by ID.
     */
    public async findById(id: string): Promise<IContactQuery | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await ContactQuery.findById(id);
    }

    /**
     * Finds all ContactQueries associated with a specific user.
     */
    public async findByUserId(userId: string): Promise<IContactQuery[]> {
        if (!mongoose.Types.ObjectId.isValid(userId)) return [];
        return await ContactQuery.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ updatedAt: -1 });
    }

    /**
     * Retrieves all ContactQueries sorted by updatedAt descending.
     */
    public async findAll(): Promise<IContactQuery[]> {
        return await ContactQuery.find().sort({ updatedAt: -1 });
    }

    /**
     * Updates the status of a ContactQuery document by ID.
     */
    public async updateStatus(id: string, status: 'PENDING' | 'RESOLVED'): Promise<IContactQuery | null> {
        if (!mongoose.Types.ObjectId.isValid(id)) return null;
        return await ContactQuery.findByIdAndUpdate(id, { status }, { new: true });
    }

    /**
     * Saves changes on an existing Mongoose ContactQuery document.
     */
    public async save(queryDoc: IContactQuery): Promise<IContactQuery> {
        return await queryDoc.save();
    }
}
