import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeliveryDto {
  @ApiProperty({
    description: 'Código de rastreio único do pacote',
    example: 'TRK-BR-9901',
  })
  @IsString()
  @IsNotEmpty()
  trackingCode: string;

  @ApiProperty({
    description: 'Nome completo do destinatário',
    example: 'Mariana Souza',
  })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({
    description: 'Endereço físico completo para realização da entrega',
    example: 'Av. Brasil, 1500 - Centro, Rio de Janeiro - RJ',
  })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;
}
