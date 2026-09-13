import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Delivery } from '../../../domain/entities/delivery.entity';
import {
  BatchUpsertResult,
  DeliveryRepository,
} from '../../../domain/repositories/delivery.repository';
import { DeliveryOrmEntity } from '../entities/delivery.orm-entity';
import { DeliveryMapper } from '../mappers/delivery.mapper';

@Injectable()
export class TypeOrmDeliveryRepository implements DeliveryRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(DeliveryOrmEntity)
    private readonly repo: Repository<DeliveryOrmEntity>
  ) {}

  public async create(delivery: Delivery): Promise<Delivery> {
    const orm = DeliveryMapper.toOrm(delivery);
    const saved = await this.repo.save(orm);
    return DeliveryMapper.toDomain(saved);
  }

  public async saveBatchUpsert(deliveries: Delivery[]): Promise<BatchUpsertResult> {
    if (deliveries.length === 0) {
      return { saved: [], ignoredCount: 0 };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const saved: Delivery[] = [];
      let ignoredCount = 0;

      for (const delivery of deliveries) {
        const existing = await queryRunner.manager.findOne(DeliveryOrmEntity, {
          where: { id: delivery.id },
        });

        if (!existing) {
          const orm = DeliveryMapper.toOrm(delivery);
          await queryRunner.manager.insert(DeliveryOrmEntity, orm);
          saved.push(delivery);
        } else {
          if (existing.occurredAt > delivery.occurredAt) {
            ignoredCount++;
            saved.push(DeliveryMapper.toDomain(existing));
          } else {
            existing.status = delivery.status;
            existing.recipientName = delivery.recipientName;
            existing.deliveryAddress = delivery.deliveryAddress;
            existing.occurredAt = delivery.occurredAt;
            existing.syncedAt = delivery.syncedAt ?? new Date();

            const updated = await queryRunner.manager.save(DeliveryOrmEntity, existing);
            saved.push(DeliveryMapper.toDomain(updated));
          }
        }
      }

      await queryRunner.commitTransaction();
      return { saved, ignoredCount };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  public async findById(id: string): Promise<Delivery | null> {
    const orm = await this.repo.findOne({ where: { id } });
    return orm ? DeliveryMapper.toDomain(orm) : null;
  }

  public async findAll(): Promise<Delivery[]> {
    const records = await this.repo.find({ order: { occurredAt: 'DESC' } });
    return records.map((record) => DeliveryMapper.toDomain(record));
  }
}
