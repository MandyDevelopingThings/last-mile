import { Delivery } from '../entities/delivery.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';

export interface DeliveryStatusUpdate {
  id: string;
  status: DeliveryStatus;
  occurredAt: Date;
  syncedAt: Date;
}

export interface BatchUpsertResult {
  saved: Delivery[];
  ignoredCount: number;
}

export abstract class DeliveryRepository {
  abstract create(delivery: Delivery): Promise<Delivery>;
  abstract updateBatchStatuses(updates: DeliveryStatusUpdate[]): Promise<BatchUpsertResult>;
  abstract findById(id: string): Promise<Delivery | null>;
  abstract findAll(): Promise<Delivery[]>;
}
