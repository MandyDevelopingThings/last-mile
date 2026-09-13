export interface CreateDeliveryOutput {
  id: string;
  trackingCode: string;
  status: string;
  recipientName: string;
  deliveryAddress: string;
  occurredAt: string;
  version: number;
}
