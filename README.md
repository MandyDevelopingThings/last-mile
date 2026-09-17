# LastMile

API backend desenvolvida em **NestJS**, **TypeScript** e **PostgreSQL** para resolução de sincronização de dados em logística *last-mile* com conectividade intermitente (*offline-first*).

---

## O Problema Resolvido

Entregadores em trânsito frequentemente perdem o sinal 4G. Quando o dispositivo recupera a conexão, o aplicativo móvel dispara sincronizações em lote com tentativas automáticas (*retries*). Isso gera dois desafios críticos de sistemas distribuídos:

1. **Duplicação de Operações:** *Retries* automáticos podem processar o mesmo pacote mais de uma vez.
2. **Conflito de Ordenação Temporal:** Pacotes atualizados em horários diferentes podem chegar ao servidor fora de ordem devido à latência de rede.

### Soluções Implementadas
* **Motor de Idempotência:** Interceptor HTTP com header `Idempotency-Key`, hashing determinístico **SHA-256** do *payload* e bloqueio de requisições concorrentes em voo (`409 Conflict`).
* **Resolução Last-Write-Wins (LWW):** Se um evento defasado chegar após um evento mais recente, ele é ignorado com segurança sem interromper o lote.
* **Tolerância a Clock Skew:** Margem de 5 segundos (`DEFAULT_CLOCK_SKEW_TOLERANCE_MS`) para tolerar pequenas variações de NTP nos relógios dos smartphones.
* **Identificadores UUIDv7:** IDs ordenáveis no tempo, otimizando a indexação de chaves primárias no PostgreSQL.

---

## Tecnologias

* **Runtime & Framework:** Node.js 20+, NestJS 10, TypeScript (strict)
* **Banco de Dados & ORM:** PostgreSQL 16, TypeORM
* **Infraestrutura:** Docker, Docker Compose
* **Qualidade & Testes:** Jest (51 testes automatizados)
* **Documentação:** Swagger / OpenAPI 3.0

---

## Como Rodar o Projeto

### Pré-requisitos
* [Node.js 20+](https://nodejs.org/) e `npm`
* [Docker](https://www.docker.com/) e `docker compose`

### 1. Clonar e Configurar Variáveis de Ambiente
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/last-mile.git
cd last-mile

# Crie o arquivo .env a partir do exemplo
cp .env.example .env

# Instale as dependências
npm install
```

### 2. Iniciar a Aplicação

#### Opção A: Executar Tudo via Docker (Recomendado)
```bash
docker compose up -d
```
A API estará acessível em `http://localhost:3000`.

#### Opção B: Apenas o Banco no Docker + API Local
```bash
# 1. Inicia apenas o container do PostgreSQL (porta 5433 no host)
docker compose up -d postgres

# 2. Inicia a API em modo de desenvolvimento
npm run start:dev
```

---

## Documentação da API (Swagger)

Com a API rodando, acesse a documentação interativa da OpenAPI no navegador:

**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

## Simulador de Concorrência e Resiliência

O projeto conta com um script automatizado que simula o comportamento real de múltiplos entregadores sob rede instável:

```bash
npm run simulate
```

O simulador executa 5 cenários:
1. **Concorrência (Lock em voo):** Dispara 10 requisições simultâneas com a mesma chave (1 adquire o lock `200 OK`, 9 recebem `409 Conflict`).
2. **Client Retry com Exponential Backoff e Full Jitter:** Clientes que receberam `409` aguardam com intervalo aleatório e obtêm a resposta salva em cache.
3. **Detecção de Adulteração:** Impede reutilização da mesma chave com *payload* diferente (`422 Unprocessable Entity`).
4. **Desordem Temporal (LWW):** Tenta atualizar um pacote com evento antigo e valida o descarte automático.
5. **Auditoria de Banco:** Varre as tabelas do PostgreSQL e comprova zero duplicidades.

---

## Testes Automatizados

A suíte de testes cobre entidades de domínio, regras de idempotência, repositórios e controllers:

```bash
# Executa todos os testes unitários e de integração
npm test

# Executa com relatório de cobertura de código
npm run test:cov
```
