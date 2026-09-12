import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryOrmEntity } from './persistence/entities/delivery.orm-entity';
import { DeliveryRepository } from '../domain/repositories/delivery.repository';
import { TypeOrmDeliveryRepository } from './persistence/repositories/typeorm-delivery.repository';
import { SyncDeliveriesUseCase } from '../application/use-cases/sync-deliveries.use-case';
import { ListDeliveriesUseCase } from '../application/use-cases/list-deliveries.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryOrmEntity])],
  providers: [
    SyncDeliveriesUseCase,
    ListDeliveriesUseCase,
    {
      provide: DeliveryRepository,
      useClass: TypeOrmDeliveryRepository,
    },
  ],
  exports: [
    SyncDeliveriesUseCase,
    ListDeliveriesUseCase,
    DeliveryRepository,
    TypeOrmModule,
  ],
})
export class DeliveryModule {}
