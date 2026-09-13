import { ApiProperty } from '@nestjs/swagger';

export class BadRequestErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Idempotency-Key header is required' })
  message: string | string[];

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/deliveries' })
  path: string;
}

export class ConflictErrorResponseDto extends BadRequestErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'Conflict' })
  error: string;

  @ApiProperty({ example: 'A request with this Idempotency-Key is currently in progress' })
  message: string;
}

export class UnprocessableEntityErrorResponseDto extends BadRequestErrorResponseDto {
  @ApiProperty({ example: 422 })
  statusCode: number;

  @ApiProperty({ example: 'Unprocessable Entity' })
  error: string;

  @ApiProperty({ example: 'Idempotency key reused with different payload' })
  message: string;
}

export class ErrorResponseDto extends BadRequestErrorResponseDto {}
