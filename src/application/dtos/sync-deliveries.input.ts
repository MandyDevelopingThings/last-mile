import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';

export interface SyncDeliveryItemInput {
  id: string;
  status: DeliveryStatus;
  occurredAt: string;
}

export interface SyncDeliveriesInput {
  deliveries: SyncDeliveryItemInput[];
}
