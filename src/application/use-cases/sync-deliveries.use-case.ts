import { Injectable } from '@nestjs/common';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';
import { DEFAULT_CLOCK_SKEW_TOLERANCE_MS } from '../../domain/constants/delivery.constants';
import {
  DeliveryRepository,
  DeliveryStatusUpdate,
} from '../../domain/repositories/delivery.repository';
import { SyncDeliveriesInput } from '../dtos/sync-deliveries.input';
import { SyncDeliveriesOutput } from '../dtos/sync-deliveries.output';

@Injectable()
export class SyncDeliveriesUseCase {
  constructor(private readonly deliveryRepository: DeliveryRepository) {}

  public async execute(input: SyncDeliveriesInput): Promise<SyncDeliveriesOutput> {
    const syncTime = new Date();
    const maxAllowedDate = new Date(Date.now() + DEFAULT_CLOCK_SKEW_TOLERANCE_MS);

    const consolidatedMap = new Map<string, DeliveryStatusUpdate>();

    for (const item of input.deliveries) {
      if (!item.id || item.id.trim().length === 0) {
        throw new Error('Delivery ID is required');
      }

      if (item.status === DeliveryStatus.PENDING) {
        throw new Error('Delivery status cannot be PENDING in sync operation');
      }

      const occurredAtDate = new Date(item.occurredAt);
      if (isNaN(occurredAtDate.getTime())) {
        throw new Error('Valid occurredAt date is required');
      }

      if (occurredAtDate > maxAllowedDate) {
        throw new Error('occurredAt cannot be in the future');
      }

      const update: DeliveryStatusUpdate = {
        id: item.id.trim(),
        status: item.status,
        occurredAt: occurredAtDate,
        syncedAt: syncTime,
      };

      const existing = consolidatedMap.get(update.id);
      if (!existing || update.occurredAt >= existing.occurredAt) {
        consolidatedMap.set(update.id, update);
      }
    }

    const uniqueUpdates = Array.from(consolidatedMap.values());
    const result = await this.deliveryRepository.updateBatchStatuses(uniqueUpdates);

    const inBatchIgnoredCount = input.deliveries.length - uniqueUpdates.length;
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
