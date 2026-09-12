import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyRecordOrmEntity } from './idempotency-record.orm-entity';
import {
  IdempotencyRepository,
  InsertIdempotencyRecordData,
  UpdateIdempotencyStatusData,
} from './idempotency.repository';
import { IdempotencyStatus } from './idempotency-status.enum';

@Injectable()
export class TypeOrmIdempotencyRepository implements IdempotencyRepository {
  constructor(
    @InjectRepository(IdempotencyRecordOrmEntity)
    private readonly repo: Repository<IdempotencyRecordOrmEntity>
  ) {}

  public async findByKey(key: string): Promise<IdempotencyRecordOrmEntity | null> {
    return this.repo.findOne({ where: { key } });
  }

  public async insertKey(data: InsertIdempotencyRecordData): Promise<void> {
    await this.repo.insert(data);
  }

  public async updateStatus(
    key: string,
    status: IdempotencyStatus,
    extra?: UpdateIdempotencyStatusData
  ): Promise<void> {
    await this.repo.update({ key }, { status, ...extra });
  }
}
