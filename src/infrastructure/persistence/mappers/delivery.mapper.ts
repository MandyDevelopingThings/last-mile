import { Delivery } from '../../../domain/entities/delivery.entity';
import { DeliveryOrmEntity } from '../entities/delivery.orm-entity';

export class DeliveryMapper {
  public static toDomain(orm: DeliveryOrmEntity): Delivery {
    return new Delivery({
      id: orm.id,
      trackingCode: orm.trackingCode,
      status: orm.status,
      recipientName: orm.recipientName,
      deliveryAddress: orm.deliveryAddress,
      occurredAt: orm.occurredAt,
      syncedAt: orm.syncedAt,
      version: orm.version,
    });
  }

  public static toOrm(domain: Delivery): DeliveryOrmEntity {
    const orm = new DeliveryOrmEntity();
    orm.id = domain.id;
    orm.trackingCode = domain.trackingCode;
    orm.status = domain.status;
    orm.recipientName = domain.recipientName;
    orm.deliveryAddress = domain.deliveryAddress;
    orm.occurredAt = domain.occurredAt;
    orm.syncedAt = domain.syncedAt ?? new Date();
    orm.version = domain.version;
    return orm;
  }
}
