import { CreateDeliveryOutput } from './create-delivery.output';

export interface SyncedDeliveryItemOutput extends CreateDeliveryOutput {
  syncedAt: string;
}

export interface SyncDeliveriesOutput {
  totalReceived: number;
  processedCount: number;
  ignoredCount: number;
  syncedAt: string;
  deliveries: SyncedDeliveryItemOutput[];
}
