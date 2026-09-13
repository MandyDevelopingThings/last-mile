import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeliveryDto {
  @ApiProperty({ example: 'TRK-BR-9901' })
  @IsString()
  @IsNotEmpty()
  trackingCode: string;

  @ApiProperty({ example: 'Mariana Souza' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: 'Av. Brasil, 1500 - Centro, Rio de Janeiro - RJ' })
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;
}
