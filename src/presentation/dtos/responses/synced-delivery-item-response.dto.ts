import { ApiProperty } from '@nestjs/swagger';
import { CreateDeliveryResponseDto } from './create-delivery-response.dto';

export class SyncedDeliveryItemResponseDto extends CreateDeliveryResponseDto {
  @ApiProperty({
    description: 'Timestamp de gravação no servidor (ISO 8601)',
    example: '2026-09-17T14:35:00.000Z',
  })
  syncedAt: string;
}
