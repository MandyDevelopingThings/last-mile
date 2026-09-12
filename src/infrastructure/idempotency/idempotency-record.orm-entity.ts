import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IdempotencyStatus } from './idempotency-status.enum';

@Entity('idempotency_records')
export class IdempotencyRecordOrmEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  key: string;

  @Column({ name: 'request_path', type: 'text' })
  requestPath: string;

  @Column({ name: 'request_hash', type: 'varchar', length: 64 })
  requestHash: string;

  @Column({
    type: 'enum',
    enum: IdempotencyStatus,
    default: IdempotencyStatus.PROCESSING,
  })
  status: IdempotencyStatus;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ name: 'response_body', type: 'jsonb', nullable: true })
  responseBody: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}
