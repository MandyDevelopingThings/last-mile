import { Delivery } from '../entities/delivery.entity';

export interface BatchUpsertResult {
  saved: Delivery[];
  ignoredCount: number;
}

export interface IDeliveryRepository {
  saveBatchUpsert(deliveries: Delivery[]): Promise<BatchUpsertResult>;
  findById(id: string): Promise<Delivery | null>;
  findAll(): Promise<Delivery[]>;
}
