export interface SyncedDeliveryItemOutput {
  id: string;
  trackingCode: string;
  status: string;
  recipientName: string;
  deliveryAddress: string;
  occurredAt: string;
  syncedAt: string;
  version: number;
}

export interface SyncDeliveriesOutput {
  totalReceived: number;
  processedCount: number;
  ignoredCount: number;
  syncedAt: string;
  deliveries: SyncedDeliveryItemOutput[];
}
