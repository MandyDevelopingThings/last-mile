import { v7 as uuidv7 } from 'uuid';
import { SyncDeliveriesUseCase } from './sync-deliveries.use-case';
import { DeliveryRepository } from '../../domain/repositories/delivery.repository';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';
import { Delivery } from '../../domain/entities/delivery.entity';

describe('SyncDeliveriesUseCase (Unit Tests)', () => {
  let useCase: SyncDeliveriesUseCase;
  let mockDeliveryRepository: {
    saveBatchUpsert: jest.Mock;
    findById: jest.Mock;
    findAll: jest.Mock;
  };

  beforeEach(() => {
    mockDeliveryRepository = {
      saveBatchUpsert: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    useCase = new SyncDeliveriesUseCase(mockDeliveryRepository as unknown as DeliveryRepository);
  });

  const validItem = {
    id: uuidv7(),
    trackingCode: 'TRK-001',
    status: DeliveryStatus.PENDING,
    recipientName: 'Maria Santos',
    deliveryAddress: 'Rua das Flores, 123',
    occurredAt: new Date(Date.now() - 60000).toISOString(),
  };

  it('deve processar lote de entregas com sucesso e carimbar syncedAt', async () => {
    const domainDelivery = new Delivery({
      ...validItem,
      occurredAt: new Date(validItem.occurredAt),
    });

    mockDeliveryRepository.saveBatchUpsert.mockResolvedValue({
      saved: [domainDelivery],
      ignoredCount: 0,
    });

    const result = await useCase.execute({
      deliveries: [validItem],
    });

    expect(result.totalReceived).toBe(1);
    expect(result.processedCount).toBe(1);
    expect(result.ignoredCount).toBe(0);
    expect(result.deliveries).toHaveLength(1);
    expect(result.deliveries[0].id).toBe(validItem.id);
    expect(result.deliveries[0].syncedAt).toBeDefined();
    expect(mockDeliveryRepository.saveBatchUpsert).toHaveBeenCalledTimes(1);
  });

  it('deve contabilizar corretamente itens ignorados por estarem desatualizados', async () => {
    const domainDelivery = new Delivery({
      ...validItem,
      occurredAt: new Date(validItem.occurredAt),
    });

    mockDeliveryRepository.saveBatchUpsert.mockResolvedValue({
      saved: [domainDelivery],
      ignoredCount: 1,
    });

    const result = await useCase.execute({
      deliveries: [validItem],
    });

    expect(result.totalReceived).toBe(1);
    expect(result.processedCount).toBe(0);
    expect(result.ignoredCount).toBe(1);
  });

  it('deve lançar erro se algum item do lote violar regra de domínio (occurredAt no futuro)', async () => {
    const invalidItem = {
      ...validItem,
      id: uuidv7(),
      occurredAt: new Date(Date.now() + 600000).toISOString(),
    };

    await expect(
      useCase.execute({ deliveries: [invalidItem] })
    ).rejects.toThrow('occurredAt cannot be in the future');

    expect(mockDeliveryRepository.saveBatchUpsert).not.toHaveBeenCalled();
  });

  it('deve lidar com lote vazio retornando contadores zerados', async () => {
    mockDeliveryRepository.saveBatchUpsert.mockResolvedValue({
      saved: [],
      ignoredCount: 0,
    });

    const result = await useCase.execute({ deliveries: [] });

    expect(result.totalReceived).toBe(0);
    expect(result.processedCount).toBe(0);
    expect(result.ignoredCount).toBe(0);
    expect(result.deliveries).toHaveLength(0);
  });

  it('deve consolidar em memória múltiplos eventos para o mesmo id mantendo o mais recente', async () => {
    const sharedId = uuidv7();
    const olderEvent = {
      id: sharedId,
      trackingCode: 'TRK-999',
      status: DeliveryStatus.FAILED_ATTEMPT,
      recipientName: 'Carlos Silva',
      deliveryAddress: 'Av Brasil, 500',
      occurredAt: new Date(Date.now() - 120000).toISOString(),
    };
    const newerEvent = {
      id: sharedId,
      trackingCode: 'TRK-999',
      status: DeliveryStatus.DELIVERED,
      recipientName: 'Carlos Silva',
      deliveryAddress: 'Av Brasil, 500',
      occurredAt: new Date(Date.now() - 60000).toISOString(),
    };

    const domainDelivery = new Delivery({
      ...newerEvent,
      occurredAt: new Date(newerEvent.occurredAt),
    });

    mockDeliveryRepository.saveBatchUpsert.mockResolvedValue({
      saved: [domainDelivery],
      ignoredCount: 0,
    });

    const result = await useCase.execute({
      deliveries: [olderEvent, newerEvent],
    });

    expect(result.totalReceived).toBe(2);
    expect(result.processedCount).toBe(1);
    expect(result.ignoredCount).toBe(1);
    expect(result.deliveries).toHaveLength(1);
    expect(result.deliveries[0].status).toBe(DeliveryStatus.DELIVERED);

    expect(mockDeliveryRepository.saveBatchUpsert).toHaveBeenCalledTimes(1);
    const persistedDeliveries: Delivery[] = mockDeliveryRepository.saveBatchUpsert.mock.calls[0][0];
    expect(persistedDeliveries).toHaveLength(1);
    expect(persistedDeliveries[0].id).toBe(sharedId);
    expect(persistedDeliveries[0].status).toBe(DeliveryStatus.DELIVERED);
  });

  it('deve manter o evento mais recente mesmo se os eventos chegarem invertidos no lote', async () => {
    const sharedId = uuidv7();
    const olderEvent = {
      id: sharedId,
      trackingCode: 'TRK-888',
      status: DeliveryStatus.PENDING,
      recipientName: 'Ana Clara',
      deliveryAddress: 'Rua Sol, 42',
      occurredAt: new Date(Date.now() - 120000).toISOString(),
    };
    const newerEvent = {
      id: sharedId,
      trackingCode: 'TRK-888',
      status: DeliveryStatus.IN_TRANSIT,
      recipientName: 'Ana Clara',
      deliveryAddress: 'Rua Sol, 42',
      occurredAt: new Date(Date.now() - 60000).toISOString(),
    };

    const domainDelivery = new Delivery({
      ...newerEvent,
      occurredAt: new Date(newerEvent.occurredAt),
    });

    mockDeliveryRepository.saveBatchUpsert.mockResolvedValue({
      saved: [domainDelivery],
      ignoredCount: 0,
    });

    const result = await useCase.execute({
      deliveries: [newerEvent, olderEvent],
    });

    expect(result.totalReceived).toBe(2);
    expect(result.processedCount).toBe(1);
    expect(result.ignoredCount).toBe(1);
    expect(result.deliveries).toHaveLength(1);
    expect(result.deliveries[0].status).toBe(DeliveryStatus.IN_TRANSIT);

    const persistedDeliveries: Delivery[] = mockDeliveryRepository.saveBatchUpsert.mock.calls[0][0];
    expect(persistedDeliveries).toHaveLength(1);
    expect(persistedDeliveries[0].status).toBe(DeliveryStatus.IN_TRANSIT);
  });
});
