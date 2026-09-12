import {
  IsArray,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';

export class SyncDeliveryItemDto {
  @IsUUID('all')
  id: string;

  @IsString()
  @IsNotEmpty()
  trackingCode: string;

  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;

  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsISO8601()
  occurredAt: string;
}

export class SyncDeliveriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncDeliveryItemDto)
  deliveries: SyncDeliveryItemDto[];
}
