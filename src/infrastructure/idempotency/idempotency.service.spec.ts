import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyRepository } from './idempotency.repository';
import { IdempotencyStatus } from './idempotency-status.enum';
import { PayloadHasher } from './payload-hasher';

describe('IdempotencyService (Unit Tests)', () => {
  let service: IdempotencyService;
  let mockRepo: {
    findByKey: jest.Mock;
    insertKey: jest.Mock;
    updateStatus: jest.Mock;
  };

  const sampleKey = 'test-idempotency-key-123';
  const samplePath = '/sync/deliveries';
  const samplePayload = { orderId: 'ORD-99', status: 'DELIVERED' };

  beforeEach(async () => {
    mockRepo = {
      findByKey: jest.fn(),
      insertKey: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayloadHasher,
        IdempotencyService,
        {
          provide: IdempotencyRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
  });

  describe('Processamento de Chaves (processKey)', () => {
    it('deve registrar chave como PROCESSING se for a primeira requisição', async () => {
      mockRepo.findByKey.mockResolvedValue(null);
      mockRepo.insertKey.mockResolvedValue(undefined);

      const result = await service.processKey(sampleKey, samplePath, samplePayload);

      expect(result.isCached).toBe(false);
      expect(mockRepo.insertKey).toHaveBeenCalledWith(
        expect.objectContaining({
          key: sampleKey,
          requestPath: samplePath,
          status: IdempotencyStatus.PROCESSING,
        })
      );
    });

    it('deve lançar 422 UnprocessableEntityException se a mesma chave for reenviada com payload diferente', async () => {
      const hashOriginal = service.computeHash(samplePayload);
      mockRepo.findByKey.mockResolvedValue({
        key: sampleKey,
        requestHash: hashOriginal,
        status: IdempotencyStatus.COMPLETED,
      });

      const payloadAlterado = { orderId: 'ORD-99', status: 'FAILED' };

      await expect(
        service.processKey(sampleKey, samplePath, payloadAlterado)
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('deve lançar 409 ConflictException se uma requisição concorrente tentar usar a mesma chave em PROCESSING', async () => {
      const hash = service.computeHash(samplePayload);
      mockRepo.findByKey.mockResolvedValue({
        key: sampleKey,
        requestHash: hash,
        status: IdempotencyStatus.PROCESSING,
        createdAt: new Date(),
      });

      await expect(
        service.processKey(sampleKey, samplePath, samplePayload)
      ).rejects.toThrow(ConflictException);
    });

    it('deve recuperar a chave se estiver em PROCESSING há mais de 30 segundos (chave órfã / crash)', async () => {
      const hash = service.computeHash(samplePayload);
      const expiredDate = new Date(Date.now() - 35_000);

      mockRepo.findByKey.mockResolvedValue({
        key: sampleKey,
        requestHash: hash,
        status: IdempotencyStatus.PROCESSING,
        createdAt: expiredDate,
      });
      mockRepo.updateStatus.mockResolvedValue(undefined);

      const result = await service.processKey(sampleKey, samplePath, samplePayload);

      expect(result.isCached).toBe(false);
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        sampleKey,
        IdempotencyStatus.PROCESSING,
        expect.objectContaining({
          createdAt: expect.any(Date),
        })
      );
    });

    it('deve retornar a resposta salva em cache se a requisição já foi concluída (COMPLETED)', async () => {
      const hash = service.computeHash(samplePayload);
      const savedBody = { success: true, count: 5 };

      mockRepo.findByKey.mockResolvedValue({
        key: sampleKey,
        requestHash: hash,
        status: IdempotencyStatus.COMPLETED,
        statusCode: 201,
        responseBody: savedBody,
      });

      const result = await service.processKey(sampleKey, samplePath, samplePayload);

      expect(result.isCached).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.responseBody).toEqual(savedBody);
      expect(mockRepo.insertKey).not.toHaveBeenCalled();
    });

    it('deve lidar com colisão de concorrência simultânea quando o insert falha com erro 23505', async () => {
      const hash = service.computeHash(samplePayload);

      mockRepo.findByKey.mockResolvedValueOnce(null);
      mockRepo.insertKey.mockRejectedValueOnce({ code: '23505' });
      mockRepo.findByKey.mockResolvedValueOnce({
        key: sampleKey,
        requestHash: hash,
        status: IdempotencyStatus.PROCESSING,
        createdAt: new Date(),
      });

      await expect(
        service.processKey(sampleKey, samplePath, samplePayload)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Conclusão e Falha de Chaves', () => {
    it('deve atualizar para COMPLETED com status code e payload', async () => {
      mockRepo.updateStatus.mockResolvedValue(undefined);

      await service.completeKey(sampleKey, 201, { message: 'Ok' });

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        sampleKey,
        IdempotencyStatus.COMPLETED,
        {
          statusCode: 201,
          responseBody: { message: 'Ok' },
        }
      );
    });

    it('deve atualizar para FAILED em caso de erro na execução', async () => {
      mockRepo.updateStatus.mockResolvedValue(undefined);

      await service.failKey(sampleKey);

      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        sampleKey,
        IdempotencyStatus.FAILED
      );
    });
  });
});
