import { PayloadHasher } from './payload-hasher';

describe('PayloadHasher (Unit Tests)', () => {
  let hasher: PayloadHasher;

  beforeEach(() => {
    hasher = new PayloadHasher();
  });

  it('deve gerar o mesmo hash independentemente da ordem das chaves do objeto', () => {
    const payloadA = { a: 1, b: 2, c: { d: 3, e: 4 } };
    const payloadB = { b: 2, c: { e: 4, d: 3 }, a: 1 };

    const hashA = hasher.hash(payloadA);
    const hashB = hasher.hash(payloadB);

    expect(hashA).toBe(hashB);
  });

  it('deve gerar hashes diferentes para conteúdos diferentes', () => {
    const hashA = hasher.hash({ amount: 100 });
    const hashB = hasher.hash({ amount: 200 });

    expect(hashA).not.toBe(hashB);
  });

  it('deve gerar hashes diferentes para objetos Date com datas diferentes', () => {
    const payloadA = { occurredAt: new Date('2026-01-01T10:00:00.000Z') };
    const payloadB = { occurredAt: new Date('2026-12-31T20:00:00.000Z') };

    const hashA = hasher.hash(payloadA);
    const hashB = hasher.hash(payloadB);

    expect(hashA).not.toBe(hashB);
  });

  it('deve ignorar chaves com valor undefined na serialização', () => {
    const payloadA = { a: 1 };
    const payloadB = { a: 1, b: undefined };

    const hashA = hasher.hash(payloadA);
    const hashB = hasher.hash(payloadB);

    expect(hashA).toBe(hashB);
  });
});
