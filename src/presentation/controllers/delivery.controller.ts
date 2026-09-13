import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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
  public async createDelivery(
    @Body() dto: CreateDeliveryDto
  ): Promise<CreateDeliveryOutput> {
    return this.createDeliveryUseCase.execute(dto);
  }

  @Post('sync/deliveries')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(IdempotencyInterceptor)
  public async syncDeliveries(
    @Body() dto: SyncDeliveriesDto
  ): Promise<SyncDeliveriesOutput> {
    return this.syncDeliveriesUseCase.execute(dto);
  }

  @Get('deliveries')
  public async listDeliveries(): Promise<SyncedDeliveryItemOutput[]> {
    return this.listDeliveriesUseCase.execute();
  }
}
