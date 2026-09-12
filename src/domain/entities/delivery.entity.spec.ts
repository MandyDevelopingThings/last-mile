import { v7 as uuidv7 } from 'uuid';
import { Delivery } from './delivery.entity';
import { DeliveryStatus } from '../enums/delivery-status.enum';

describe('Delivery Entity (Domain Layer)', () => {
  const validProps = {
    id: uuidv7(),
    trackingCode: 'TRK-BR-9988',
    recipientName: 'Carlos Silva',
    deliveryAddress: 'Av. Paulista, 1000 - Bela Vista, SP',
    occurredAt: new Date(Date.now() - 60000), // 1 minuto atrás
  };

  it('deve instanciar uma entrega válida com valores padrão', () => {
    const delivery = new Delivery(validProps);

    expect(delivery.id).toBe(validProps.id);
    expect(delivery.trackingCode).toBe(validProps.trackingCode);
    expect(delivery.recipientName).toBe(validProps.recipientName);
    expect(delivery.deliveryAddress).toBe(validProps.deliveryAddress);
    expect(delivery.occurredAt).toEqual(validProps.occurredAt);
    expect(delivery.status).toBe(DeliveryStatus.PENDING);
    expect(delivery.syncedAt).toBeNull();
    expect(delivery.version).toBe(1);
  });

  it('deve permitir definir um status inicial customizado', () => {
    const delivery = new Delivery({
      ...validProps,
      status: DeliveryStatus.IN_TRANSIT,
    });

    expect(delivery.status).toBe(DeliveryStatus.IN_TRANSIT);
  });

  describe('Validações de Invariantes', () => {
    it('deve lançar erro se o ID for vazio', () => {
      expect(() => new Delivery({ ...validProps, id: '' })).toThrow('Delivery ID is required');
    });

    it('deve lançar erro se o trackingCode for vazio ou apenas espaços', () => {
      expect(() => new Delivery({ ...validProps, trackingCode: '   ' })).toThrow(
        'Tracking code cannot be empty'
      );
    });

    it('deve lançar erro se o recipientName for vazio', () => {
      expect(() => new Delivery({ ...validProps, recipientName: '' })).toThrow(
        'Recipient name cannot be empty'
      );
    });

    it('deve lançar erro se o deliveryAddress for vazio', () => {
      expect(() => new Delivery({ ...validProps, deliveryAddress: '' })).toThrow(
        'Delivery address cannot be empty'
      );
    });

    it('deve rejeitar occurredAt no futuro', () => {
      const futureDate = new Date(Date.now() + 600000); // 10 minutos no futuro
      expect(() => new Delivery({ ...validProps, occurredAt: futureDate })).toThrow(
        'occurredAt cannot be in the future'
      );
    });
  });

  describe('Transições de Status', () => {
    it('deve permitir transição de PENDING para IN_TRANSIT', () => {
      const delivery = new Delivery(validProps);
      delivery.markAsInTransit();
      expect(delivery.status).toBe(DeliveryStatus.IN_TRANSIT);
    });

    it('deve permitir transição de IN_TRANSIT para DELIVERED', () => {
      const delivery = new Delivery({ ...validProps, status: DeliveryStatus.IN_TRANSIT });
      delivery.markAsDelivered();
      expect(delivery.status).toBe(DeliveryStatus.DELIVERED);
    });

    it('deve permitir marcar como FAILED_ATTEMPT', () => {
      const delivery = new Delivery(validProps);
      delivery.markAsFailedAttempt();
      expect(delivery.status).toBe(DeliveryStatus.FAILED_ATTEMPT);
    });

    it('deve permitir entregar após uma tentativa falha anterior', () => {
      const delivery = new Delivery({ ...validProps, status: DeliveryStatus.FAILED_ATTEMPT });
      delivery.markAsDelivered();
      expect(delivery.status).toBe(DeliveryStatus.DELIVERED);
    });

    it('deve BLOQUEAR transição de DELIVERED para IN_TRANSIT', () => {
      const delivery = new Delivery({ ...validProps, status: DeliveryStatus.DELIVERED });
      expect(() => delivery.markAsInTransit()).toThrow(
        'Cannot change status to IN_TRANSIT once package is DELIVERED'
      );
    });

    it('deve BLOQUEAR transição de DELIVERED para FAILED_ATTEMPT', () => {
      const delivery = new Delivery({ ...validProps, status: DeliveryStatus.DELIVERED });
      expect(() => delivery.markAsFailedAttempt()).toThrow(
        'Cannot mark as FAILED_ATTEMPT once package is DELIVERED'
      );
    });
  });

  describe('Sincronização', () => {
    it('deve marcar entrega como sincronizada com a data fornecida', () => {
      const delivery = new Delivery(validProps);
      const syncDate = new Date();
      delivery.markAsSynced(syncDate);

      expect(delivery.syncedAt).toEqual(syncDate);
    });
  });
});
