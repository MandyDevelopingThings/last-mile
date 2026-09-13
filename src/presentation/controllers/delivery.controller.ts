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
  ApiHeader,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse,
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
import {
  CreateDeliveryResponseDto,
  SyncDeliveriesResponseDto,
  SyncedDeliveryItemResponseDto,
  BadRequestErrorResponseDto,
  ConflictErrorResponseDto,
  UnprocessableEntityErrorResponseDto,
} from '../dtos/responses';

@ApiTags('Deliveries')
@Controller()
export class DeliveryController {
  constructor(
    private readonly createDeliveryUseCase: CreateDeliveryUseCase,
    private readonly syncDeliveriesUseCase: SyncDeliveriesUseCase,
    private readonly listDeliveriesUseCase: ListDeliveriesUseCase
  ) { }

  @Post('deliveries')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Cadastrar nova entrega pendente (Central/Expedição)' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiCreatedResponse({ type: CreateDeliveryResponseDto })
  @ApiBadRequestResponse({ type: BadRequestErrorResponseDto })
  @ApiConflictResponse({ type: ConflictErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: UnprocessableEntityErrorResponseDto })
  public async createDelivery(
    @Body() dto: CreateDeliveryDto
  ): Promise<CreateDeliveryOutput> {
    return this.createDeliveryUseCase.execute(dto);
  }

  @Post('sync/deliveries')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(IdempotencyInterceptor)
  @ApiOperation({ summary: 'Sincronizar lote de entregas (POST /sync/deliveries)' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOkResponse({ type: SyncDeliveriesResponseDto })
  @ApiBadRequestResponse({ type: BadRequestErrorResponseDto })
  @ApiConflictResponse({ type: ConflictErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: UnprocessableEntityErrorResponseDto })
  public async syncDeliveries(
    @Body() dto: SyncDeliveriesDto
  ): Promise<SyncDeliveriesOutput> {
    return this.syncDeliveriesUseCase.execute(dto);
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'Listar todas as entregas persistidas para auditoria' })
  @ApiOkResponse({ type: [SyncedDeliveryItemResponseDto] })
  public async listDeliveries(): Promise<SyncedDeliveryItemOutput[]> {
    return this.listDeliveriesUseCase.execute();
  }
}
