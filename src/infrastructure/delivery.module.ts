import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryOrmEntity } from './persistence/entities/delivery.orm-entity';
import { DeliveryRepository } from '../domain/repositories/delivery.repository';
import { TypeOrmDeliveryRepository } from './persistence/repositories/typeorm-delivery.repository';
import { SyncDeliveriesUseCase } from '../application/use-cases/sync-deliveries.use-case';
import { ListDeliveriesUseCase } from '../application/use-cases/list-deliveries.use-case';
import { CreateDeliveryUseCase } from '../application/use-cases/create-delivery.use-case';
import { DeliveryController } from '../presentation/controllers/delivery.controller';
import { IdempotencyInterceptor } from '../presentation/interceptors/idempotency.interceptor';
import { IdempotencyModule } from './idempotency/idempotency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryOrmEntity]),
    IdempotencyModule,
  ],
  controllers: [DeliveryController],
  providers: [
    CreateDeliveryUseCase,
    SyncDeliveriesUseCase,
    ListDeliveriesUseCase,
    IdempotencyInterceptor,
    {
      provide: DeliveryRepository,
      useClass: TypeOrmDeliveryRepository,
    },
  ],
  exports: [
    CreateDeliveryUseCase,
    SyncDeliveriesUseCase,
    ListDeliveriesUseCase,
    DeliveryRepository,
    TypeOrmModule,
  ],
})
export class DeliveryModule {}
