import { Delivery } from '../entities/delivery.entity';

export interface BatchUpsertResult {
  saved: Delivery[];
  ignoredCount: number;
}

export abstract class DeliveryRepository {
  abstract saveBatchUpsert(deliveries: Delivery[]): Promise<BatchUpsertResult>;
  abstract findById(id: string): Promise<Delivery | null>;
  abstract findAll(): Promise<Delivery[]>;
}
