import { IdempotencyRecordOrmEntity } from './idempotency-record.orm-entity';
import { IdempotencyStatus } from './idempotency-status.enum';

export interface InsertIdempotencyRecordData {
  key: string;
  requestPath: string;
  requestHash: string;
  status: IdempotencyStatus;
}

export interface UpdateIdempotencyStatusData {
  statusCode?: number | null;
  responseBody?: Record<string, any> | null;
  createdAt?: Date;
}

export abstract class IdempotencyRepository {
  abstract findByKey(key: string): Promise<IdempotencyRecordOrmEntity | null>;
  abstract insertKey(data: InsertIdempotencyRecordData): Promise<void>;
  abstract updateStatus(
    key: string,
    status: IdempotencyStatus,
    extra?: UpdateIdempotencyStatusData
  ): Promise<void>;
}
