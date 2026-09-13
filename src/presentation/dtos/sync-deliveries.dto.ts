import {
  IsArray,
  IsIn,
  IsISO8601,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';

export const ALLOWED_SYNC_STATUSES = [
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.DELIVERED,
  DeliveryStatus.FAILED_ATTEMPT,
] as const;

export class SyncDeliveryItemDto {
  @IsUUID('all')
  id: string;

  @IsIn(ALLOWED_SYNC_STATUSES, {
    message: `status must be one of: ${ALLOWED_SYNC_STATUSES.join(', ')} (PENDING is not allowed in POST /sync/deliveries)`,
  })
  status: DeliveryStatus;

  @IsISO8601()
  occurredAt: string;
}

export class SyncDeliveriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncDeliveryItemDto)
  deliveries: SyncDeliveryItemDto[];
}
