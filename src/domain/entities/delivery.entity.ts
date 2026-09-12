import { DeliveryStatus } from '../enums/delivery-status.enum';

const CLOCK_SKEW_TOLERANCE_MS = 5_000;

export interface CreateDeliveryProps {
  id: string;
  trackingCode: string;
  status?: DeliveryStatus;
  recipientName: string;
  deliveryAddress: string;
  occurredAt: Date;
  syncedAt?: Date | null;
  version?: number;
}

export class Delivery {
  public readonly id: string;
  public readonly trackingCode: string;
  public status: DeliveryStatus;
  public readonly recipientName: string;
  public readonly deliveryAddress: string;
  public readonly occurredAt: Date;
  public syncedAt: Date | null;
  public version: number;

  constructor(props: CreateDeliveryProps) {
    this.validate(props);

    this.id = props.id;
    this.trackingCode = props.trackingCode.trim();
    this.status = props.status ?? DeliveryStatus.PENDING;
    this.recipientName = props.recipientName.trim();
    this.deliveryAddress = props.deliveryAddress.trim();
    this.occurredAt = props.occurredAt;
    this.syncedAt = props.syncedAt ?? null;
    this.version = props.version ?? 1;
  }

  private validate(props: CreateDeliveryProps): void {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('Delivery ID is required');
    }

    if (!props.trackingCode || props.trackingCode.trim().length === 0) {
      throw new Error('Tracking code cannot be empty');
    }

    if (!props.recipientName || props.recipientName.trim().length === 0) {
      throw new Error('Recipient name cannot be empty');
    }

    if (!props.deliveryAddress || props.deliveryAddress.trim().length === 0) {
      throw new Error('Delivery address cannot be empty');
    }

    if (!props.occurredAt || isNaN(props.occurredAt.getTime())) {
      throw new Error('Valid occurredAt date is required');
    }

    const maxAllowedDate = new Date(Date.now() + CLOCK_SKEW_TOLERANCE_MS);
    if (props.occurredAt > maxAllowedDate) {
      throw new Error('occurredAt cannot be in the future');
    }
  }

  public markAsInTransit(): void {
    if (this.status === DeliveryStatus.DELIVERED) {
      throw new Error('Cannot change status to IN_TRANSIT once package is DELIVERED');
    }
    this.status = DeliveryStatus.IN_TRANSIT;
  }

  public markAsDelivered(): void {
    this.status = DeliveryStatus.DELIVERED;
  }

  public markAsFailedAttempt(): void {
    if (this.status === DeliveryStatus.DELIVERED) {
      throw new Error('Cannot mark as FAILED_ATTEMPT once package is DELIVERED');
    }
    this.status = DeliveryStatus.FAILED_ATTEMPT;
  }

  public markAsSynced(syncedAt: Date = new Date()): void {
    if (!syncedAt || isNaN(syncedAt.getTime())) {
      throw new Error('Valid syncedAt date is required');
    }
    this.syncedAt = syncedAt;
  }
}
