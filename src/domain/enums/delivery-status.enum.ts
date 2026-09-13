export enum DeliveryStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED_ATTEMPT = 'FAILED_ATTEMPT',
}

export const ALLOWED_SYNC_STATUSES = [
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.DELIVERED,
  DeliveryStatus.FAILED_ATTEMPT,
] as const;
