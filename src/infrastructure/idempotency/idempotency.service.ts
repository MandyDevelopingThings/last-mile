import {
  Injectable,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IdempotencyRepository } from './idempotency.repository';
import { IdempotencyStatus } from './idempotency-status.enum';
import { PayloadHasher } from './payload-hasher';

const LOCK_TTL_MS = 30_000;
const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';

export interface IdempotencyCheckResult {
  isCached: boolean;
  statusCode?: number;
  responseBody?: Record<string, any>;
}

@Injectable()
export class IdempotencyService {
  constructor(
    private readonly repository: IdempotencyRepository,
    private readonly hasher: PayloadHasher
  ) {}

  public computeHash(payload: any): string {
    return this.hasher.hash(payload);
  }

  public async processKey(
    key: string,
    path: string,
    payload: any
  ): Promise<IdempotencyCheckResult> {
    const currentHash = this.hasher.hash(payload);
    const existing = await this.repository.findByKey(key);

    if (existing) {
      if (existing.requestHash !== currentHash) {
        throw new UnprocessableEntityException(
          'Idempotency key reused with different payload'
        );
      }

      if (existing.status === IdempotencyStatus.PROCESSING) {
        const isExpired = Date.now() - existing.createdAt.getTime() > LOCK_TTL_MS;

        if (!isExpired) {
          throw new ConflictException(
            'A request with this Idempotency-Key is currently in progress'
          );
        }

        await this.repository.updateStatus(key, IdempotencyStatus.PROCESSING, {
          createdAt: new Date(),
        });
        return { isCached: false };
      }

      if (existing.status === IdempotencyStatus.COMPLETED) {
        return {
          isCached: true,
          statusCode: existing.statusCode ?? 200,
          responseBody: existing.responseBody ?? {},
        };
      }

      if (existing.status === IdempotencyStatus.FAILED) {
        await this.repository.updateStatus(key, IdempotencyStatus.PROCESSING, {
          createdAt: new Date(),
        });
        return { isCached: false };
      }
    }

    try {
      await this.repository.insertKey({
        key,
        requestPath: path,
        requestHash: currentHash,
        status: IdempotencyStatus.PROCESSING,
      });

      return { isCached: false };
    } catch (error: any) {
      if (error?.code === POSTGRES_UNIQUE_VIOLATION_CODE) {
        return this.processKey(key, path, payload);
      }
      throw error;
    }
  }

  public async completeKey(
    key: string,
    statusCode: number,
    responseBody: Record<string, any>
  ): Promise<void> {
    await this.repository.updateStatus(key, IdempotencyStatus.COMPLETED, {
      statusCode,
      responseBody,
    });
  }

  public async failKey(key: string): Promise<void> {
    await this.repository.updateStatus(key, IdempotencyStatus.FAILED);
  }
}
