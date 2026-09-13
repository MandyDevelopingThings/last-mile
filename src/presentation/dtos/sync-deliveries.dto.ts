import {
  IsArray,
  IsIn,
  IsISO8601,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';

export const ALLOWED_SYNC_STATUSES = [
  DeliveryStatus.IN_TRANSIT,
  DeliveryStatus.DELIVERED,
  DeliveryStatus.FAILED_ATTEMPT,
] as const;

export class SyncDeliveryItemDto {
  @ApiProperty({ example: '0191f630-1000-7000-8000-000000000001' })
  @IsUUID('all')
  id: string;

  @ApiProperty({
    enum: ALLOWED_SYNC_STATUSES,
    example: DeliveryStatus.DELIVERED,
  })
  @IsIn(ALLOWED_SYNC_STATUSES, {
    message: `status must be one of: ${ALLOWED_SYNC_STATUSES.join(', ')} (PENDING is not allowed in POST /sync/deliveries)`,
  })
  status: DeliveryStatus;

  @ApiProperty({ example: '2026-09-16T14:30:00.000Z' })
  @IsISO8601()
  occurredAt: string;
}

export class SyncDeliveriesDto {
  @ApiProperty({ type: [SyncDeliveryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncDeliveryItemDto)
  deliveries: SyncDeliveryItemDto[];
}
