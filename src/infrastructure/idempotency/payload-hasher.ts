import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PayloadHasher {
  public hash(payload: any): string {
    const serialized = this.deterministicStringify(payload ?? {});
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  private deterministicStringify(obj: any): string {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }

    if (obj instanceof Date) {
      return JSON.stringify(obj.toISOString());
    }

    if (Array.isArray(obj)) {
      return `[${obj.map((item) => this.deterministicStringify(item)).join(',')}]`;
    }

    const sortedKeys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort();

    const entries = sortedKeys.map(
      (k) => `${JSON.stringify(k)}:${this.deterministicStringify(obj[k])}`
    );
    return `{${entries.join(',')}}`;
  }
}
