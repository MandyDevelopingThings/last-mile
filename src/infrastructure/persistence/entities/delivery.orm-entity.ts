import {
  Entity,
  PrimaryColumn,
  Column,
  VersionColumn,
  Index,
} from 'typeorm';
import { DeliveryStatus } from '../../../domain/enums/delivery-status.enum';

@Entity('deliveries')
export class DeliveryOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'tracking_code', type: 'varchar', length: 100 })
  trackingCode: string;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @Column({ name: 'recipient_name', type: 'varchar', length: 255 })
  recipientName: string;

  @Column({ name: 'delivery_address', type: 'text' })
  deliveryAddress: string;

  @Column({ name: 'occurred_at', type: 'timestamp with time zone' })
  occurredAt: Date;

  @Column({ name: 'synced_at', type: 'timestamp with time zone' })
  syncedAt: Date;

  @VersionColumn()
  version: number;
}
