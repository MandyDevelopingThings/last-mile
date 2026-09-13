import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { CreateDeliveryUseCase } from '../../application/use-cases/create-delivery.use-case';
import { SyncDeliveriesUseCase } from '../../application/use-cases/sync-deliveries.use-case';
import { ListDeliveriesUseCase } from '../../application/use-cases/list-deliveries.use-case';
import { CreateDeliveryDto } from '../dtos/create-delivery.dto';
import { SyncDeliveriesDto } from '../dtos/sync-deliveries.dto';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';
import { CreateDeliveryOutput } from '../../application/dtos/create-delivery.output';
import {
  SyncDeliveriesOutput,
  SyncedDeliveryItemOutput,
} from '../../application/dtos/sync-deliveries.output';

@ApiTags('Deliveries')
@Controller()
export class DeliveryController {
  constructor(
    private readonly createDeliveryUseCase: CreateDeliveryUseCase,
    private readonly syncDeliveriesUseCase: SyncDeliveriesUseCase,
    private readonly listDeliveriesUseCase: ListDeliveriesUseCase
  ) {}

  @Post('deliveries')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({
    summary: 'Cadastrar nova entrega pendente (Central / Expedição)',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Chave única de idempotência (UUIDv7 recomendada)',
    required: true,
  })
  @ApiResponse({
    status: 201,
    description: 'Entrega cadastrada com sucesso com status PENDING',
  })
  @ApiResponse({
    status: 400,
    description: 'Header Idempotency-Key ausente ou validação violada',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito de concorrência em vôo (In-Flight Lock)',
  })
  @ApiResponse({
    status: 422,
    description: 'Chave de idempotência reutilizada com payload modificado',
  })
  public async createDelivery(
    @Body() dto: CreateDeliveryDto
  ): Promise<CreateDeliveryOutput> {
    return this.createDeliveryUseCase.execute(dto);
  }

  @Post('sync/deliveries')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({
    summary: 'Sincronizar lote de entregas com idempotência estrita e resolução Last-Write-Wins (Entregador / Mobile)',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    description: 'Chave única de idempotência (UUIDv7 recomendada)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Lote processado com sucesso ou resposta retornada do cache de idempotência',
  })
  @ApiResponse({
    status: 400,
    description: 'Header Idempotency-Key ausente ou validação violada',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito de concorrência em vôo (In-Flight Lock)',
  })
  @ApiResponse({
    status: 422,
    description: 'Chave de idempotência reutilizada com payload modificado',
  })
  public async syncDeliveries(
    @Body() dto: SyncDeliveriesDto
  ): Promise<SyncDeliveriesOutput> {
    return this.syncDeliveriesUseCase.execute(dto);
  }

  @Get('deliveries')
  @ApiOperation({
    summary: 'Listar todas as entregas persistidas para auditoria',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de entregas ordenadas por occurredAt decrescente',
  })
  public async listDeliveries(): Promise<SyncedDeliveryItemOutput[]> {
    return this.listDeliveriesUseCase.execute();
  }
}
