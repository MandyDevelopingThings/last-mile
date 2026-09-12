import { ExecutionContext, CallHandler, BadRequestException, HttpStatus } from '@nestjs/common';
import { of, throwError, lastValueFrom } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { IdempotencyService } from '../../infrastructure/idempotency/idempotency.service';

describe('IdempotencyInterceptor (Unit Tests)', () => {
  let interceptor: IdempotencyInterceptor;
  let mockIdempotencyService: {
    processKey: jest.Mock;
    completeKey: jest.Mock;
    failKey: jest.Mock;
  };
  let mockContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    mockIdempotencyService = {
      processKey: jest.fn(),
      completeKey: jest.fn().mockResolvedValue(undefined),
      failKey: jest.fn().mockResolvedValue(undefined),
    };

    interceptor = new IdempotencyInterceptor(
      mockIdempotencyService as unknown as IdempotencyService
    );

    mockRequest = {
      headers: {
        'idempotency-key': 'test-idempotency-key',
      },
      path: '/sync/deliveries',
      body: { deliveries: [] },
    };

    mockResponse = {
      statusCode: 200,
      status: jest.fn().mockReturnThis(),
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of({ processedCount: 1 })),
    };
  });

  it('deve lançar BadRequestException quando o header Idempotency-Key estiver ausente', async () => {
    delete mockRequest.headers['idempotency-key'];

    await expect(
      interceptor.intercept(mockContext, mockCallHandler)
    ).rejects.toThrow(BadRequestException);

    expect(mockIdempotencyService.processKey).not.toHaveBeenCalled();
  });

  it('deve lançar BadRequestException quando o header Idempotency-Key for uma string vazia', async () => {
    mockRequest.headers['idempotency-key'] = '   ';

    await expect(
      interceptor.intercept(mockContext, mockCallHandler)
    ).rejects.toThrow(BadRequestException);

    expect(mockIdempotencyService.processKey).not.toHaveBeenCalled();
  });

  it('deve aceitar header como array e utilizar o primeiro elemento', async () => {
    mockRequest.headers['idempotency-key'] = ['first-key', 'second-key'];
    mockIdempotencyService.processKey.mockResolvedValue({ isCached: false });

    const result$ = await interceptor.intercept(mockContext, mockCallHandler);
    await lastValueFrom(result$);

    expect(mockIdempotencyService.processKey).toHaveBeenCalledWith(
      'first-key',
      '/sync/deliveries',
      { deliveries: [] }
    );
  });

  it('deve retornar resposta em cache e ajustar status code quando a chave já foi completada', async () => {
    mockIdempotencyService.processKey.mockResolvedValue({
      isCached: true,
      statusCode: HttpStatus.OK,
      responseBody: { cached: true },
    });

    const result$ = await interceptor.intercept(mockContext, mockCallHandler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual({ cached: true });
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockCallHandler.handle).not.toHaveBeenCalled();
  });

  it('deve executar o handler e chamar completeKey no sucesso quando não estiver em cache', async () => {
    mockIdempotencyService.processKey.mockResolvedValue({
      isCached: false,
    });

    const result$ = await interceptor.intercept(mockContext, mockCallHandler);
    const result = await lastValueFrom(result$);

    expect(result).toEqual({ processedCount: 1 });
    expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
    expect(mockIdempotencyService.completeKey).toHaveBeenCalledWith(
      'test-idempotency-key',
      200,
      { processedCount: 1 }
    );
  });

  it('deve chamar failKey e propagar o erro quando a execução do handler falhar', async () => {
    mockIdempotencyService.processKey.mockResolvedValue({
      isCached: false,
    });

    mockCallHandler.handle = jest
      .fn()
      .mockReturnValue(throwError(() => new Error('Handler processing failed')));

    const result$ = await interceptor.intercept(mockContext, mockCallHandler);

    await expect(lastValueFrom(result$)).rejects.toThrow('Handler processing failed');

    expect(mockIdempotencyService.failKey).toHaveBeenCalledWith('test-idempotency-key');
    expect(mockIdempotencyService.completeKey).not.toHaveBeenCalled();
  });
});
