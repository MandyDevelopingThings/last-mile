import { v7 as uuidv7 } from 'uuid';
import { ListDeliveriesUseCase } from './list-deliveries.use-case';
import { DeliveryRepository } from '../../domain/repositories/delivery.repository';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';
import { Delivery } from '../../domain/entities/delivery.entity';

describe('ListDeliveriesUseCase (Unit Tests)', () => {
  let useCase: ListDeliveriesUseCase;
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

    useCase = new ListDeliveriesUseCase(mockDeliveryRepository as unknown as DeliveryRepository);
  });

  it('deve listar entregas ordenadas e formatadas', async () => {
    const delivery = new Delivery({
      id: uuidv7(),
      trackingCode: 'TRK-LIST-01',
      status: DeliveryStatus.DELIVERED,
      recipientName: 'Juliana Lima',
      deliveryAddress: 'Rua Central, 10',
      occurredAt: new Date(Date.now() - 30000),
    });
    delivery.markAsSynced(new Date());

    mockDeliveryRepository.findAll.mockResolvedValue([delivery]);

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(delivery.id);
    expect(result[0].trackingCode).toBe('TRK-LIST-01');
    expect(result[0].status).toBe(DeliveryStatus.DELIVERED);
    expect(result[0].recipientName).toBe('Juliana Lima');
    expect(result[0].deliveryAddress).toBe('Rua Central, 10');
    expect(result[0].syncedAt).toBeDefined();
    expect(mockDeliveryRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('deve retornar array vazio quando não houver entregas cadastradas', async () => {
    mockDeliveryRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toHaveLength(0);
    expect(mockDeliveryRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
