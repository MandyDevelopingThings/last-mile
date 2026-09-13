import { v7 as uuidv7 } from 'uuid';
import { SyncDeliveriesUseCase } from './sync-deliveries.use-case';
import { DeliveryRepository, DeliveryStatusUpdate } from '../../domain/repositories/delivery.repository';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';
import { Delivery } from '../../domain/entities/delivery.entity';

describe('SyncDeliveriesUseCase (Unit Tests)', () => {
  let useCase: SyncDeliveriesUseCase;
  let mockDeliveryRepository: {
    create: jest.Mock;
    updateBatchStatuses: jest.Mock;
    findById: jest.Mock;
    findAll: jest.Mock;
  };

  beforeEach(() => {
    mockDeliveryRepository = {
      create: jest.fn(),
      updateBatchStatuses: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    useCase = new SyncDeliveriesUseCase(mockDeliveryRepository as unknown as DeliveryRepository);
  });

  const validItem = {
    id: uuidv7(),
    status: DeliveryStatus.DELIVERED,
    occurredAt: new Date(Date.now() - 60000).toISOString(),
  };

  const domainDelivery = new Delivery({
    id: validItem.id,
    trackingCode: 'TRK-001',
    status: validItem.status,
    recipientName: 'Maria Santos',
    deliveryAddress: 'Rua das Flores, 123',
    occurredAt: new Date(validItem.occurredAt),
  });

  it('deve processar lote de atualizações de status com sucesso', async () => {
    mockDeliveryRepository.updateBatchStatuses.mockResolvedValue({
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
    expect(mockDeliveryRepository.updateBatchStatuses).toHaveBeenCalledTimes(1);
  });

  it('deve contabilizar corretamente itens ignorados por estarem desatualizados', async () => {
    mockDeliveryRepository.updateBatchStatuses.mockResolvedValue({
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

    expect(mockDeliveryRepository.updateBatchStatuses).not.toHaveBeenCalled();
  });

  it('deve lançar erro se o id da entrega for vazio', async () => {
    const invalidItem = {
      id: '   ',
      status: DeliveryStatus.DELIVERED,
      occurredAt: new Date().toISOString(),
    };

    await expect(
      useCase.execute({ deliveries: [invalidItem] })
    ).rejects.toThrow('Delivery ID is required');

    expect(mockDeliveryRepository.updateBatchStatuses).not.toHaveBeenCalled();
  });

  it('deve lidar com lote vazio retornando contadores zerados', async () => {
    mockDeliveryRepository.updateBatchStatuses.mockResolvedValue({
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
      status: DeliveryStatus.FAILED_ATTEMPT,
      occurredAt: new Date(Date.now() - 120000).toISOString(),
    };
    const newerEvent = {
      id: sharedId,
      status: DeliveryStatus.DELIVERED,
      occurredAt: new Date(Date.now() - 60000).toISOString(),
    };

    mockDeliveryRepository.updateBatchStatuses.mockResolvedValue({
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

    expect(mockDeliveryRepository.updateBatchStatuses).toHaveBeenCalledTimes(1);
    const updates: DeliveryStatusUpdate[] = mockDeliveryRepository.updateBatchStatuses.mock.calls[0][0];
    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe(sharedId);
    expect(updates[0].status).toBe(DeliveryStatus.DELIVERED);
  });

  it('deve manter o evento mais recente mesmo se os eventos chegarem invertidos no lote', async () => {
    const sharedId = uuidv7();
    const olderEvent = {
      id: sharedId,
      status: DeliveryStatus.FAILED_ATTEMPT,
      occurredAt: new Date(Date.now() - 120000).toISOString(),
    };
    const newerEvent = {
      id: sharedId,
      status: DeliveryStatus.IN_TRANSIT,
      occurredAt: new Date(Date.now() - 60000).toISOString(),
    };

    mockDeliveryRepository.updateBatchStatuses.mockResolvedValue({
      saved: [domainDelivery],
      ignoredCount: 0,
    });

    const result = await useCase.execute({
      deliveries: [newerEvent, olderEvent],
    });

    expect(result.totalReceived).toBe(2);
    expect(result.processedCount).toBe(1);
    expect(result.ignoredCount).toBe(1);

    const updates: DeliveryStatusUpdate[] = mockDeliveryRepository.updateBatchStatuses.mock.calls[0][0];
    expect(updates).toHaveLength(1);
    expect(updates[0].status).toBe(DeliveryStatus.IN_TRANSIT);
  });

  it('deve lançar erro se algum evento no lote tiver status PENDING', async () => {
    await expect(
      useCase.execute({
        deliveries: [
          {
            id: uuidv7(),
            status: DeliveryStatus.PENDING,
            occurredAt: new Date().toISOString(),
          },
        ],
      })
    ).rejects.toThrow('Delivery status cannot be PENDING in sync operation');
  });
});
