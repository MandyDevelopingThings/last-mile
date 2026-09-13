import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { Delivery } from '../../domain/entities/delivery.entity';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';
import { DeliveryRepository } from '../../domain/repositories/delivery.repository';
import { CreateDeliveryInput } from '../dtos/create-delivery.input';
import { CreateDeliveryOutput } from '../dtos/create-delivery.output';

@Injectable()
export class CreateDeliveryUseCase {
  constructor(private readonly deliveryRepository: DeliveryRepository) {}

  public async execute(input: CreateDeliveryInput): Promise<CreateDeliveryOutput> {
    const delivery = new Delivery({
      id: uuidv7(),
      trackingCode: input.trackingCode,
      status: DeliveryStatus.PENDING,
      recipientName: input.recipientName,
      deliveryAddress: input.deliveryAddress,
      occurredAt: new Date(),
    });

    const created = await this.deliveryRepository.create(delivery);

    return {
      id: created.id,
      trackingCode: created.trackingCode,
      status: created.status,
      recipientName: created.recipientName,
      deliveryAddress: created.deliveryAddress,
      occurredAt: created.occurredAt.toISOString(),
      version: created.version,
    };
  }
}
