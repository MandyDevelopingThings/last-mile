import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { concatMap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { IdempotencyService } from '../../infrastructure/idempotency/idempotency.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  public async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const rawKey = request.headers['idempotency-key'];
    const idempotencyKey = Array.isArray(rawKey) ? rawKey[0] : rawKey;

    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
      throw new BadRequestException('Missing Idempotency-Key header');
    }

    const path = request.path || request.url;
    const body = request.body;

    const check = await this.idempotencyService.processKey(idempotencyKey, path, body);

    if (check.isCached) {
      const statusCode = check.statusCode ?? HttpStatus.OK;
      response.status(statusCode);
      return of(check.responseBody);
    }

    return next.handle().pipe(
      concatMap(async (data) => {
        const statusCode = response.statusCode || HttpStatus.OK;
        await this.idempotencyService.completeKey(idempotencyKey, statusCode, data);
        return data;
      }),
      catchError(async (err) => {
        await this.idempotencyService.failKey(idempotencyKey);
        throw err;
      })
    );
  }
}
