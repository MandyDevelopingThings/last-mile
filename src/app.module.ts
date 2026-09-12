import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { IdempotencyModule } from './infrastructure/idempotency/idempotency.module';
import { DeliveryModule } from './infrastructure/delivery.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    IdempotencyModule,
    DeliveryModule,
  ],
})
export class AppModule {}
