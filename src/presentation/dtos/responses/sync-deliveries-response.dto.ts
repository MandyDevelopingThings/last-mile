import { ApiProperty } from '@nestjs/swagger';
import { SyncedDeliveryItemResponseDto } from './synced-delivery-item-response.dto';

export class SyncDeliveriesResponseDto {
  @ApiProperty({ example: 3 })
  totalReceived: number;

  @ApiProperty({ example: 2 })
  processedCount: number;

  @ApiProperty({ description: 'Eventos ignorados por Last-Write-Wins', example: 1 })
  ignoredCount: number;

  @ApiProperty({ example: '2026-09-17T14:35:00.000Z' })
  syncedAt: string;

  @ApiProperty({ type: [SyncedDeliveryItemResponseDto] })
  deliveries: SyncedDeliveryItemResponseDto[];
}
