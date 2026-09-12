import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';

export interface SyncDeliveryItemInput {
  id: string;
  trackingCode: string;
  status: DeliveryStatus;
  recipientName: string;
  deliveryAddress: string;
  occurredAt: string;
}

export interface SyncDeliveriesInput {
  deliveries: SyncDeliveryItemInput[];
}
