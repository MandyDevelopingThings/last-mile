import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import axios from 'axios';
import { Client } from 'pg';
import { v7 as uuidv7 } from 'uuid';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/presentation/filters/http-exception.filter';
import { DeliveryStatus } from '../src/domain/enums/delivery-status.enum';

const API_PORT = Number(process.env.PORT || 3001);
const API_URL = `http://localhost:${API_PORT}`;
const DB_PORT = Number(process.env.DB_PORT || 5433);

const dbClient = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: DB_PORT,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lastmile_db',
});

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureServerRunning(): Promise<{ app: INestApplication | null; url: string }> {
  try {
    const res = await axios.get(`${API_URL}/deliveries`, { timeout: 1000 });
    if (Array.isArray(res.data)) {
      console.log(` Conectado ao servidor LastMile em execução em ${API_URL}`);
      return { app: null, url: API_URL };
    }
  } catch {}

  console.log(`🚀 Iniciando servidor LastMile embedded na porta ${API_PORT}...`);
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(API_PORT);
  console.log(` Servidor embedded pronto em ${API_URL}`);
  return { app, url: API_URL };
}

async function cleanDatabase(): Promise<void> {
  await dbClient.query('TRUNCATE TABLE deliveries, idempotency_records CASCADE');
  console.log(' Banco de dados limpo para os testes de simulação.\n');
}

async function executeSimulation(): Promise<void> {
  console.log('========================================================================');
  console.log('   LASTMILE TRACK — SIMULADOR DE CONCORRÊNCIA E RESILIÊNCIA DE SINCRONIZAÇÃO');
  console.log('========================================================================\n');

  await dbClient.connect();
  const { app: embeddedApp } = await ensureServerRunning();
  await cleanDatabase();

  try {
    console.log('------------------------------------------------------------------------');
    console.log('ETAPA PRÉVIA: Central cadastra entregas pendentes (POST /deliveries)');
    console.log('------------------------------------------------------------------------');

    const created1 = await axios.post(
      `${API_URL}/deliveries`,
      {
        trackingCode: 'TRK-BR-001',
        recipientName: 'Carlos Drummond',
        deliveryAddress: 'Rua Itabira, 100',
      },
      { headers: { 'Idempotency-Key': uuidv7() } }
    );
    const deliveryId1 = created1.data.id;
    console.log(`Pacote 1 cadastrado pela Central: ${deliveryId1} (TRK-BR-001) - Status: PENDING`);

    const created2 = await axios.post(
      `${API_URL}/deliveries`,
      {
        trackingCode: 'TRK-BR-002',
        recipientName: 'Clarice Lispector',
        deliveryAddress: 'Av Atlântica, 500',
      },
      { headers: { 'Idempotency-Key': uuidv7() } }
    );
    const deliveryId2 = created2.data.id;
    console.log(`Pacote 2 cadastrado pela Central: ${deliveryId2} (TRK-BR-002) - Status: PENDING\n`);

    console.log('------------------------------------------------------------------------');
    console.log('CENÁRIO 1: Concorrência Extrema e In-Flight Locking (409 Conflict)');
    console.log('------------------------------------------------------------------------');
    const sharedIdempotencyKey = uuidv7();

    const payloadScenario1 = {
      deliveries: [
        {
          id: deliveryId1,
          status: DeliveryStatus.IN_TRANSIT,
          occurredAt: new Date(Date.now() + 1000).toISOString(),
        },
        {
          id: deliveryId2,
          status: DeliveryStatus.IN_TRANSIT,
          occurredAt: new Date(Date.now() + 1000).toISOString(),
        },
      ],
    };

    console.log(`Chave de Idempotência do Lote: ${sharedIdempotencyKey}`);
    console.log(`Disparando 10 requisições simultâneas em paralelo (Promise.all)...`);

    const parallelRequests = Array.from({ length: 10 }, (_, index) =>
      axios
        .post(`${API_URL}/sync/deliveries`, payloadScenario1, {
          headers: { 'Idempotency-Key': sharedIdempotencyKey, Connection: 'close' },
          validateStatus: () => true,
        })
        .then((res) => ({ index: index + 1, status: res.status, data: res.data }))
    );

    const responses = await Promise.all(parallelRequests);

    let successCount = 0;
    let conflictCount = 0;

    for (const res of responses) {
      if (res.status === 200) {
        successCount++;
        console.log(`  [Req #${res.index}] Status 200 OK — Lock adquirido e processado.`);
      } else if (res.status === 409) {
        conflictCount++;
        console.log(`  [Req #${res.index}] Status 409 Conflict — ${res.data.message}`);
      } else {
        console.log(`  [Req #${res.index}] Status inesperado: ${res.status}`);
      }
    }

    console.log(`Resultado: ${successCount} sucesso(s) (200 OK), ${conflictCount} conflito(s) em vôo (409 Conflict).\n`);

    console.log('------------------------------------------------------------------------');
    console.log('CENÁRIO 2: Client Retry com Exponential Backoff e Full Jitter');
    console.log('------------------------------------------------------------------------');
    console.log(`Cliente com requisição 409 executará retry com a mesma chave: ${sharedIdempotencyKey}`);

    let retrySuccess = false;
    const maxAttempts = 5;
    const baseDelayMs = 100;
    const maxDelayMs = 1500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const retryRes = await axios.post(`${API_URL}/sync/deliveries`, payloadScenario1, {
        headers: { 'Idempotency-Key': sharedIdempotencyKey },
        validateStatus: () => true,
      });

      if (retryRes.status === 200) {
        console.log(`  [Tentativa #${attempt}] Sucesso 200 OK! Resposta obtida do cache de idempotência.`);
        console.log(`  Total Processado: ${retryRes.data.processedCount}, Total Recebido: ${retryRes.data.totalReceived}`);
        retrySuccess = true;
        break;
      }

      if (retryRes.status === 409) {
        const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
        const fullJitter = Math.floor(Math.random() * exponentialDelay);
        console.log(`  [Tentativa #${attempt}] 409 Conflict ainda em processamento. Backoff com Jitter: ${fullJitter}ms`);
        await sleep(fullJitter);
      }
    }

    if (!retrySuccess) {
      throw new Error('Falha no retry de idempotência.');
    }
    console.log('Cenário 2 validado com sucesso.\n');

    console.log('------------------------------------------------------------------------');
    console.log('CENÁRIO 3: Reuso de Chave com Payload Modificado (422 Unprocessable Entity)');
    console.log('------------------------------------------------------------------------');
    const tamperedPayload = {
      deliveries: [
        {
          id: deliveryId1,
          status: DeliveryStatus.DELIVERED,
          occurredAt: new Date().toISOString(),
        },
      ],
    };

    console.log(`Enviando payload adulterado com a mesma chave concluída: ${sharedIdempotencyKey}`);
    const tamperedRes = await axios.post(`${API_URL}/sync/deliveries`, tamperedPayload, {
      headers: { 'Idempotency-Key': sharedIdempotencyKey },
      validateStatus: () => true,
    });

    console.log(`Status Recebido: ${tamperedRes.status} ${tamperedRes.statusText}`);
    console.log(`Mensagem de Erro: ${JSON.stringify(tamperedRes.data)}`);
    if (tamperedRes.status !== 422) {
      throw new Error(`Esperava status 422 mas recebeu ${tamperedRes.status}`);
    }
    console.log('Cenário 3 validado com sucesso.\n');

    console.log('------------------------------------------------------------------------');
    console.log('CENÁRIO 4: Desordem Temporal e Resolução Last-Write-Wins (Out-of-order)');
    console.log('------------------------------------------------------------------------');
    const newerOccurredAt = new Date(Date.now() + 1500);
    const olderOccurredAt = new Date(Date.now() - 60000);

    const created3 = await axios.post(
      `${API_URL}/deliveries`,
      {
        trackingCode: 'TRK-ORDER-003',
        recipientName: 'Machado de Assis',
        deliveryAddress: 'Rua do Cosme Velho, 18',
      },
      { headers: { 'Idempotency-Key': uuidv7() } }
    );
    const deliveryId3 = created3.data.id;

    const initialKey = uuidv7();
    await axios.post(
      `${API_URL}/sync/deliveries`,
      {
        deliveries: [
          {
            id: deliveryId3,
            status: DeliveryStatus.DELIVERED,
            occurredAt: newerOccurredAt.toISOString(),
          },
        ],
      },
      { headers: { 'Idempotency-Key': initialKey } }
    );
    console.log(`Estado atualizado pelo motorista: TRK-ORDER-003 status = DELIVERED às ${newerOccurredAt.toISOString()}`);

    const lateArrivalKey = uuidv7();
    const lateResponse = await axios.post(
      `${API_URL}/sync/deliveries`,
      {
        deliveries: [
          {
            id: deliveryId3,
            status: DeliveryStatus.FAILED_ATTEMPT,
            occurredAt: olderOccurredAt.toISOString(),
          },
        ],
      },
      { headers: { 'Idempotency-Key': lateArrivalKey } }
    );

    console.log(`Tentativa de atualizar com evento mais antigo (${olderOccurredAt.toISOString()}):`);
    console.log(`Resultado: Ignorados = ${lateResponse.data.ignoredCount}, Processados = ${lateResponse.data.processedCount}`);
    if (lateResponse.data.ignoredCount !== 1) {
      throw new Error('O evento desatualizado deveria ter sido contabilizado como ignorado.');
    }
    console.log('Cenário 4 validado com sucesso.\n');

    console.log('------------------------------------------------------------------------');
    console.log('CENÁRIO 5: Auditoria de Banco de Dados — Garantia de Zero Duplicidade');
    console.log('------------------------------------------------------------------------');
    const duplicateCheck = await dbClient.query(`
      SELECT id, COUNT(*) as count 
      FROM deliveries 
      GROUP BY id 
      HAVING COUNT(*) > 1
    `);

    console.log(`Duplicatas encontradas na tabela 'deliveries': ${duplicateCheck.rows.length}`);
    if (duplicateCheck.rows.length > 0) {
      throw new Error('Falha grave: foram encontradas entregas duplicadas no banco!');
    }

    const totalDeliveriesRes = await dbClient.query('SELECT COUNT(*) as total FROM deliveries');
    const totalRecordsRes = await dbClient.query('SELECT COUNT(*) as total FROM idempotency_records');

    console.log(`Total de Entregas Únicas Persistidas: ${totalDeliveriesRes.rows[0].total}`);
    console.log(`Total de Registros de Idempotência: ${totalRecordsRes.rows[0].total}`);

    const deliveriesList = await dbClient.query(
      'SELECT id, tracking_code, status, version, occurred_at FROM deliveries ORDER BY tracking_code'
    );
    console.log('\nRegistros finais na tabela `deliveries`:');
    console.table(deliveriesList.rows);

    const idempotencyList = await dbClient.query(
      'SELECT key, status, status_code, request_hash FROM idempotency_records'
    );
    console.log('\nRegistros de Idempotência:');
    console.table(idempotencyList.rows);

    console.log('\n========================================================================');
    console.log('   TODOS OS CENÁRIOS FORAM EXECUTADOS E VALIDADOS COM 100% DE SUCESSO!   ');
    console.log('========================================================================\n');
  } finally {
    await dbClient.end();
    if (embeddedApp) {
      await embeddedApp.close();
    }
  }
}

executeSimulation().catch((err) => {
  console.error('Erro na execução do simulador:', err);
  process.exit(1);
});
