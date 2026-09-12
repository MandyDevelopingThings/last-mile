import { DeliveryController } from './delivery.controller';
import { SyncDeliveriesUseCase } from '../../application/use-cases/sync-deliveries.use-case';
import { ListDeliveriesUseCase } from '../../application/use-cases/list-deliveries.use-case';
import { SyncDeliveriesDto } from '../dtos/sync-deliveries.dto';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';

describe('DeliveryController (Unit Tests)', () => {
  let controller: DeliveryController;
  let mockSyncUseCase: { execute: jest.Mock };
  let mockListUseCase: { execute: jest.Mock };

  beforeEach(() => {
    mockSyncUseCase = { execute: jest.fn() };
    mockListUseCase = { execute: jest.fn() };

    controller = new DeliveryController(
      mockSyncUseCase as unknown as SyncDeliveriesUseCase,
      mockListUseCase as unknown as ListDeliveriesUseCase
    );
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
