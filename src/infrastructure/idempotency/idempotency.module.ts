import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyRecordOrmEntity } from './idempotency-record.orm-entity';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyRepository } from './idempotency.repository';
import { TypeOrmIdempotencyRepository } from './typeorm-idempotency.repository';
import { PayloadHasher } from './payload-hasher';

@Module({
  imports: [TypeOrmModule.forFeature([IdempotencyRecordOrmEntity])],
  providers: [
    PayloadHasher,
    IdempotencyService,
    {
      provide: IdempotencyRepository,
      useClass: TypeOrmIdempotencyRepository,
    },
  ],
  exports: [IdempotencyService, IdempotencyRepository, PayloadHasher, TypeOrmModule],
})
export class IdempotencyModule {}
