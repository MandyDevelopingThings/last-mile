import { Injectable } from '@nestjs/common';
import { Delivery } from '../../domain/entities/delivery.entity';
import { DeliveryRepository } from '../../domain/repositories/delivery.repository';
import { SyncDeliveriesInput } from '../dtos/sync-deliveries.input';
import { SyncDeliveriesOutput } from '../dtos/sync-deliveries.output';

@Injectable()
export class SyncDeliveriesUseCase {
  constructor(private readonly deliveryRepository: DeliveryRepository) {}

  public async execute(input: SyncDeliveriesInput): Promise<SyncDeliveriesOutput> {
    const syncTime = new Date();

    const consolidatedMap = new Map<string, Delivery>();

    for (const item of input.deliveries) {
      const delivery = new Delivery({
        id: item.id,
        trackingCode: item.trackingCode,
        status: item.status,
        recipientName: item.recipientName,
        deliveryAddress: item.deliveryAddress,
        occurredAt: new Date(item.occurredAt),
      });

      delivery.markAsSynced(syncTime);

      const existing = consolidatedMap.get(delivery.id);
      if (!existing || delivery.occurredAt >= existing.occurredAt) {
        consolidatedMap.set(delivery.id, delivery);
      }
    }

    const uniqueDeliveries = Array.from(consolidatedMap.values());
    const result = await this.deliveryRepository.saveBatchUpsert(uniqueDeliveries);

    const inBatchIgnoredCount = input.deliveries.length - uniqueDeliveries.length;
    const totalIgnoredCount = inBatchIgnoredCount + result.ignoredCount;

    return {
      totalReceived: input.deliveries.length,
      processedCount: result.saved.length - result.ignoredCount,
      ignoredCount: totalIgnoredCount,
      syncedAt: syncTime.toISOString(),
      deliveries: result.saved.map((d) => ({
        id: d.id,
        trackingCode: d.trackingCode,
        status: d.status,
        recipientName: d.recipientName,
        deliveryAddress: d.deliveryAddress,
        occurredAt: d.occurredAt.toISOString(),
        syncedAt: d.syncedAt ? d.syncedAt.toISOString() : syncTime.toISOString(),
        version: d.version,
      })),
    };
  }
}
