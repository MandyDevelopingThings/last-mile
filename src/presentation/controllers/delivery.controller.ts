import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SyncDeliveriesUseCase } from '../../application/use-cases/sync-deliveries.use-case';
import { ListDeliveriesUseCase } from '../../application/use-cases/list-deliveries.use-case';
import { SyncDeliveriesDto } from '../dtos/sync-deliveries.dto';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor';
import {
  SyncDeliveriesOutput,
  SyncedDeliveryItemOutput,
} from '../../application/dtos/sync-deliveries.output';

@Controller()
export class DeliveryController {
  constructor(
    private readonly syncDeliveriesUseCase: SyncDeliveriesUseCase,
    private readonly listDeliveriesUseCase: ListDeliveriesUseCase
  ) {}

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
