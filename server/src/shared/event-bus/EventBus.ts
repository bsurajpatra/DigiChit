import { logger } from '@shared/logger/logger.js';
import { EventEmitter } from 'events';

export interface IDomainEvent<T = any> {
    eventType: string;
    timestamp: Date;
    data: T;
}

export class EventBus extends EventEmitter {
    private static instance: EventBus;

    private constructor() {
        super();
    }

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    public publish<T = any>(event: IDomainEvent<T>): void {
        logger.info(`[EventBus] Publishing event: ${event.eventType}`);
        this.emit(event.eventType, event);
    }

    public subscribe<T = any>(eventType: string, handler: (event: IDomainEvent<T>) => void): void {
        this.on(eventType, handler);
    }

    public unsubscribe<T = any>(eventType: string, handler: (event: IDomainEvent<T>) => void): void {
        this.off(eventType, handler);
    }
}

export const eventBus = EventBus.getInstance();
