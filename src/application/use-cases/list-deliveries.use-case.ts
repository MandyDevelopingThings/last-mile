import { Injectable } from '@nestjs/common';
import { DeliveryRepository } from '../../domain/repositories/delivery.repository';
import { SyncedDeliveryItemOutput } from '../dtos/sync-deliveries.output';

@Injectable()
export class ListDeliveriesUseCase {
  constructor(private readonly deliveryRepository: DeliveryRepository) {}

  public async execute(): Promise<SyncedDeliveryItemOutput[]> {
    const deliveries = await this.deliveryRepository.findAll();

    return deliveries.map((d) => ({
      id: d.id,
      trackingCode: d.trackingCode,
      status: d.status,
      recipientName: d.recipientName,
      deliveryAddress: d.deliveryAddress,
      occurredAt: d.occurredAt.toISOString(),
      syncedAt: d.syncedAt ? d.syncedAt.toISOString() : new Date().toISOString(),
      version: d.version,
    }));
  }
}
