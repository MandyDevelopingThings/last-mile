import { CreateDeliveryUseCase } from './create-delivery.use-case';
import { DeliveryRepository } from '../../domain/repositories/delivery.repository';
import { DeliveryStatus } from '../../domain/enums/delivery-status.enum';
import { Delivery } from '../../domain/entities/delivery.entity';

describe('CreateDeliveryUseCase (Unit Tests)', () => {
  let useCase: CreateDeliveryUseCase;
  let mockDeliveryRepository: {
    create: jest.Mock;
    saveBatchUpsert: jest.Mock;
    findById: jest.Mock;
    findAll: jest.Mock;
  };

  beforeEach(() => {
    mockDeliveryRepository = {
      create: jest.fn(),
      saveBatchUpsert: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    };

    useCase = new CreateDeliveryUseCase(
      mockDeliveryRepository as unknown as DeliveryRepository
    );
  });

  it('deve criar uma nova entrega com status PENDING e UUIDv7 gerado', async () => {
    const input = {
      trackingCode: 'TRK-CENTRAL-01',
      recipientName: 'Mariana Souza',
      deliveryAddress: 'Av. Brasil, 1500 - Rio de Janeiro - RJ',
    };

    mockDeliveryRepository.create.mockImplementation(async (delivery: Delivery) => delivery);

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.trackingCode).toBe('TRK-CENTRAL-01');
    expect(result.status).toBe(DeliveryStatus.PENDING);
    expect(result.recipientName).toBe('Mariana Souza');
    expect(result.deliveryAddress).toBe('Av. Brasil, 1500 - Rio de Janeiro - RJ');
    expect(result.version).toBe(1);
    expect(result.occurredAt).toBeDefined();
    expect(mockDeliveryRepository.create).toHaveBeenCalledTimes(1);
  });

  it('deve falhar se trackingCode for vazio', async () => {
    const input = {
      trackingCode: '',
      recipientName: 'Mariana Souza',
      deliveryAddress: 'Av. Brasil, 1500',
    };

    await expect(useCase.execute(input)).rejects.toThrow('Tracking code cannot be empty');
    expect(mockDeliveryRepository.create).not.toHaveBeenCalled();
  });
});
