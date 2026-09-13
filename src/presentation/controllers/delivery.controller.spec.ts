import { DeliveryController } from './delivery.controller';
import { CreateDeliveryUseCase } from '../../application/use-cases/create-delivery.use-case';
import { SyncDeliveriesUseCase } from '../../application/use-cases/sync-deliveries.use-case';
import { ListDeliveriesUseCase } from '../../application/use-cases/list-deliveries.use-case';
import { CreateDeliveryDto } from '../dtos/create-delivery.dto';
import { SyncDeliveriesDto } from '../dtos/sync-deliveries.dto';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';

describe('DeliveryController (Unit Tests)', () => {
  let controller: DeliveryController;
  let mockCreateUseCase: { execute: jest.Mock };
  let mockSyncUseCase: { execute: jest.Mock };
  let mockListUseCase: { execute: jest.Mock };

  beforeEach(() => {
    mockCreateUseCase = { execute: jest.fn() };
    mockSyncUseCase = { execute: jest.fn() };
    mockListUseCase = { execute: jest.fn() };

    controller = new DeliveryController(
      mockCreateUseCase as unknown as CreateDeliveryUseCase,
      mockSyncUseCase as unknown as SyncDeliveriesUseCase,
      mockListUseCase as unknown as ListDeliveriesUseCase
    );
  });

  it('deve delegar a criação de entrega para o CreateDeliveryUseCase', async () => {
    const dto: CreateDeliveryDto = {
      trackingCode: 'TRK-CENTRAL-100',
      recipientName: 'Mariana Souza',
      deliveryAddress: 'Av. Brasil, 1500',
    };

    const expectedOutput = {
      id: '0191f630-1000-7000-8000-000000000001',
      trackingCode: 'TRK-CENTRAL-100',
      status: DeliveryStatus.PENDING,
      recipientName: 'Mariana Souza',
      deliveryAddress: 'Av. Brasil, 1500',
      occurredAt: new Date().toISOString(),
      version: 1,
    };

    mockCreateUseCase.execute.mockResolvedValue(expectedOutput);

    const result = await controller.createDelivery(dto);

    expect(result).toBe(expectedOutput);
    expect(mockCreateUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('deve delegar a sincronização para o SyncDeliveriesUseCase', async () => {
    const dto: SyncDeliveriesDto = {
      deliveries: [
        {
          id: '0191f630-1000-7000-8000-000000000001',
          trackingCode: 'TRK-100',
          status: DeliveryStatus.PENDING,
          recipientName: 'Lucas Lima',
          deliveryAddress: 'Rua Central, 50',
          occurredAt: new Date().toISOString(),
        },
      ],
    };

    const expectedOutput = {
      totalReceived: 1,
      processedCount: 1,
      ignoredCount: 0,
      syncedAt: new Date().toISOString(),
      deliveries: [],
    };

    mockSyncUseCase.execute.mockResolvedValue(expectedOutput);

    const result = await controller.syncDeliveries(dto);

    expect(result).toBe(expectedOutput);
    expect(mockSyncUseCase.execute).toHaveBeenCalledWith(dto);
  });

  it('deve delegar a listagem para o ListDeliveriesUseCase', async () => {
    const expectedOutput = [
      {
        id: '0191f630-1000-7000-8000-000000000001',
        trackingCode: 'TRK-100',
        status: DeliveryStatus.DELIVERED,
        recipientName: 'Lucas Lima',
        deliveryAddress: 'Rua Central, 50',
        occurredAt: new Date().toISOString(),
        syncedAt: new Date().toISOString(),
        version: 1,
      },
    ];

    mockListUseCase.execute.mockResolvedValue(expectedOutput);

    const result = await controller.listDeliveries();

    expect(result).toBe(expectedOutput);
    expect(mockListUseCase.execute).toHaveBeenCalledTimes(1);
  });
});
