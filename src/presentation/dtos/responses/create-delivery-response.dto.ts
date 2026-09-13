import { ApiProperty } from '@nestjs/swagger';
import { DeliveryStatus } from '../../../domain/enums/delivery-status.enum';

export class CreateDeliveryResponseDto {
  @ApiProperty({
    description: 'UUIDv7 gerado no servidor',
    example: '0191f630-1000-7000-8000-000000000001',
  })
  id: string;

  @ApiProperty({ example: 'TRK-BR-9901' })
  trackingCode: string;

  @ApiProperty({ enum: DeliveryStatus, example: DeliveryStatus.PENDING })
  status: string;

  @ApiProperty({ example: 'Mariana Souza' })
  recipientName: string;

  @ApiProperty({ example: 'Av. Brasil, 1500 - Centro, Rio de Janeiro - RJ' })
  deliveryAddress: string;

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  occurredAt: string;

  @ApiProperty({ description: 'Versão para controle de concorrência otimista', example: 1 })
  version: number;
}
