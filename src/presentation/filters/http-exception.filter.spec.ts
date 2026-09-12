import { ArgumentsHost, ConflictException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter (Unit Tests)', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    mockRequest = {
      url: '/sync/deliveries',
    };

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('deve formatar HttpException no envelope JSON padronizado', () => {
    const exception = new ConflictException(
      'A request with this Idempotency-Key is currently in progress'
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflict',
        message: 'A request with this Idempotency-Key is currently in progress',
        path: '/sync/deliveries',
      })
    );
  });

  it('deve priorizar originalUrl se estiver disponível na requisição', () => {
    mockRequest.originalUrl = '/api/v1/sync/deliveries';
    const exception = new ConflictException('Conflict');

    filter.catch(exception, mockHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/api/v1/sync/deliveries',
      })
    );
  });

  it('deve formatar erros genéricos de validação de domínio como 400 Bad Request', () => {
    const exception = new Error('occurredAt cannot be in the future');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        message: 'occurredAt cannot be in the future',
        path: '/sync/deliveries',
      })
    );
  });

  it('deve tratar erros de infraestrutura/sistema como 500 Internal Server Error', () => {
    const exception = new Error('Connection refused');
    exception.name = 'ConnectionError';

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Connection refused',
        path: '/sync/deliveries',
      })
    );
  });
});
