# Design Document: Sistema de Agendamento

## Overview

O Sistema de Agendamento permite que usuários públicos consultem horários disponíveis e solicitem atendimentos com artistas, enquanto artistas autenticados gerenciam sua agenda completa. A arquitetura segue o padrão já estabelecido no projeto: Fastify + Prisma na API e Next.js 14 App Router no frontend.

O princípio central de segurança é a **separação total entre dados públicos e privados**: endpoints públicos nunca expõem Appointments nem dados pessoais de terceiros. O cálculo de disponibilidade é uma função pura que recebe regras, bloqueios e agendamentos existentes e retorna apenas os slots livres.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         apps/web (Next.js 14)                   │
│                                                                 │
│  /[artistSlug]                    /dashboard/calendar           │
│  PublicSchedulingPage             DashboardCalendarPage         │
│  ├── AvailabilityCalendar         ├── CalendarView              │
│  ├── SlotPicker                   ├── AppointmentCard           │
│  ├── AppointmentForm              └── StatusActions             │
│  └── StatusChecker                                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP (fetch)
┌──────────────────────▼──────────────────────────────────────────┐
│                      apps/api (Fastify 4)                       │
│                                                                 │
│  Public Routes (sem auth)         Private Routes (authenticate) │
│  ├── GET  /public/artists/:id/    ├── GET  /appointments        │
│  │        availability            ├── PATCH /appointments/:id/  │
│  ├── POST /public/artists/:id/    │         status              │
│  │        appointments            ├── DELETE /appointments/:id  │
│  └── GET  /public/appointments/   ├── CRUD /availability-rules  │
│           :requestCode            └── CRUD /availability-blocks │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Availability_Service                        │   │
│  │  generateSlots(rules, from, to, timezone) → Slot[]       │   │
│  │  filterConflicts(slots, appointments, blocks) → Slot[]   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Appointment_Service                         │   │
│  │  createWithConflictCheck(data) → Appointment (tx)        │   │
│  │  updateStatus(id, artistId, newStatus) → Appointment     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Prisma (PostgreSQL)                   │   │
│  │  Artist · AvailabilityRule · AvailabilityBlock           │   │
│  │  Appointment · Service                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### API — Módulos

#### `apps/api/src/modules/availability/`

**`availability.service.ts`** — Lógica pura de cálculo de slots (sem I/O direto):

```typescript
interface Slot {
  startAt: Date  // UTC
  endAt:   Date  // UTC
}

interface TimeInterval {
  startAt: Date
  endAt:   Date
}

/**
 * Gera todos os slots possíveis a partir das regras ativas,
 * para o período [from, to], respeitando o timezone do artista.
 */
function generateSlots(
  rules:    AvailabilityRule[],
  from:     Date,
  to:       Date,
  timezone: string,
): Slot[]

/**
 * Remove slots que conflitam com qualquer intervalo em `occupied`.
 * Conflito: slot.startAt < occupied.endAt AND slot.endAt > occupied.startAt
 */
function filterConflicts(
  slots:    Slot[],
  occupied: TimeInterval[],
): Slot[]
```

**`availability.controller.ts`** — Handlers HTTP para regras e bloqueios privados.

**`availability.routes.ts`** — Registra rotas CRUD de `/availability-rules` e `/availability-blocks`.

**`availability.schemas.ts`** — Schemas Zod para validação de entrada.

#### `apps/api/src/modules/appointments/`

**`appointments.service.ts`**:

```typescript
/**
 * Cria um Appointment dentro de uma transaction Prisma.
 * Revalida conflito imediatamente antes do INSERT.
 * Implementa idempotência por (artistId, startAt, requesterEmail).
 */
async function createWithConflictCheck(data: CreateAppointmentData): Promise<Appointment>

/**
 * Atualiza o status de um Appointment, validando a transição.
 * Verifica ownership antes de aplicar.
 */
async function updateStatus(
  id:        string,
  artistId:  string,
  newStatus: AppointmentStatus,
): Promise<Appointment>
```

**`appointments.controller.ts`** — Handlers para o calendário privado e gerenciamento de status.

**`appointments.routes.ts`** — Registra rotas privadas de `/appointments`.

**`appointments.schemas.ts`** — Schemas Zod.

#### `apps/api/src/modules/public-scheduling/`

**`public-scheduling.service.ts`** — Orquestra `Availability_Service` e `Appointment_Service` para os endpoints públicos.

**`public-scheduling.controller.ts`** — Handlers para os três endpoints públicos.

**`public-scheduling.routes.ts`** — Registra rotas sob `/public/`.

**`public-scheduling.schemas.ts`** — Schemas Zod para entrada e saída pública (sem campos sensíveis).

### Web — Componentes

#### UI Pública (`apps/web/src/app/[artistSlug]/`)

- **`AvailabilityCalendar`** — Calendário mensal mostrando apenas dias com slots disponíveis
- **`SlotPicker`** — Lista de horários livres para o dia selecionado
- **`AppointmentForm`** — Formulário de solicitação (nome, email, telefone?, notas?)
- **`StatusChecker`** — Campo para consultar status por `requestCode`

#### Dashboard (`apps/web/src/app/dashboard/calendar/`)

- **`CalendarView`** — Calendário com navegação mês/semana/dia
- **`AppointmentCard`** — Card com nome, serviço, status e ações
- **`StatusActions`** — Botões confirmar/rejeitar/cancelar

---

## Data Models

### Alterações no Prisma Schema

#### Novo campo em `Artist`

```prisma
timezone  String  @default("America/Sao_Paulo") @db.VarChar(50)
```

#### Novos models

```prisma
model AvailabilityRule {
  id          String   @id @default(uuid()) @db.Uuid
  artistId    String   @map("artist_id") @db.Uuid
  weekday     Int      // 0=domingo, 6=sábado
  startTime   String   @map("start_time") @db.VarChar(5)   // "09:00"
  endTime     String   @map("end_time")   @db.VarChar(5)   // "18:00"
  slotMinutes Int      @default(60) @map("slot_minutes")
  active      Boolean  @default(true)
  artist      Artist   @relation(fields: [artistId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt      @map("updated_at") @db.Timestamptz

  @@index([artistId, weekday])
  @@map("availability_rules")
}

model AvailabilityBlock {
  id        String   @id @default(uuid()) @db.Uuid
  artistId  String   @map("artist_id") @db.Uuid
  startAt   DateTime @map("start_at") @db.Timestamptz
  endAt     DateTime @map("end_at")   @db.Timestamptz
  reason    String?  @db.Text
  artist    Artist   @relation(fields: [artistId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt      @map("updated_at") @db.Timestamptz

  @@index([artistId, startAt])
  @@map("availability_blocks")
}

model Appointment {
  id             String            @id @default(uuid()) @db.Uuid
  artistId       String            @map("artist_id")       @db.Uuid
  requesterName  String            @map("requester_name")  @db.VarChar(100)
  requesterEmail String            @map("requester_email") @db.VarChar(255)
  requesterPhone String?           @map("requester_phone") @db.VarChar(20)
  serviceId      String?           @map("service_id")      @db.Uuid
  startAt        DateTime          @map("start_at") @db.Timestamptz
  endAt          DateTime          @map("end_at")   @db.Timestamptz
  status         AppointmentStatus @default(PENDING)
  notes          String?           @db.Text
  requestCode    String            @unique @map("request_code") @db.Uuid @default(uuid())
  artist         Artist            @relation(fields: [artistId], references: [id], onDelete: Cascade)
  service        Service?          @relation(fields: [serviceId], references: [id], onDelete: SetNull)
  createdAt      DateTime          @default(now()) @map("created_at") @db.Timestamptz
  updatedAt      DateTime          @updatedAt      @map("updated_at") @db.Timestamptz

  @@unique([artistId, startAt, requesterEmail], name: "idempotency_key")
  @@index([artistId, startAt])
  @@map("appointments")
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  REJECTED

  @@map("appointment_status")
}
```

### Transições de Status Válidas

```
PENDING   → CONFIRMED
PENDING   → REJECTED
PENDING   → CANCELLED
CONFIRMED → CANCELLED
```

### Resposta Pública de Disponibilidade

```typescript
interface PublicAvailabilityResponse {
  artistId: string
  timezone: string
  slots: Array<{
    startAt: string  // ISO 8601 UTC
    endAt:   string  // ISO 8601 UTC
  }>
}
```

### Resposta Pública de Status de Solicitação

```typescript
interface PublicAppointmentStatusResponse {
  requestCode: string
  status:      AppointmentStatus
  startAt:     string  // ISO 8601 UTC
  endAt:       string  // ISO 8601 UTC
}
// Nunca inclui: requesterName, requesterEmail, requesterPhone, artistId, notes
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Ownership invariant — criação sempre associa ao artista autenticado

*Para qualquer* regra de disponibilidade ou bloqueio criado por um artista autenticado, o `artistId` do recurso criado deve ser igual ao `artistId` extraído do token JWT, independentemente do conteúdo do body da requisição.

**Validates: Requirements 1.2, 2.2**

---

### Property 2: Ownership enforcement — artista não acessa recursos de outro artista

*Para qualquer* par de artistas distintos (A e B) e qualquer recurso (AvailabilityRule, AvailabilityBlock, Appointment) pertencente ao artista A, uma requisição autenticada como artista B deve retornar HTTP 403.

**Validates: Requirements 1.3, 2.3, 7.2, 9.5**

---

### Property 3: Validação temporal — startTime/startAt deve ser anterior a endTime/endAt

*Para qualquer* AvailabilityRule onde `startTime >= endTime`, ou qualquer AvailabilityBlock onde `startAt >= endAt`, a API deve rejeitar a criação ou atualização com HTTP 422.

**Validates: Requirements 1.6, 2.6**

---

### Property 4: Conflito de slots — slots ocupados nunca aparecem na disponibilidade pública

*Para qualquer* conjunto de AvailabilityRules, Appointments (PENDING ou CONFIRMED) e AvailabilityBlocks de um artista, nenhum slot retornado pelo endpoint público de disponibilidade deve se sobrepor temporalmente a qualquer Appointment ou AvailabilityBlock existente.

Sobreposição: `slot.startAt < occupied.endAt AND slot.endAt > occupied.startAt`

**Validates: Requirements 3.4, 3.5**

---

### Property 5: Geração de slots respeita regras ativas

*Para qualquer* conjunto de AvailabilityRules, os slots gerados devem corresponder exatamente às regras com `active = true`. Regras com `active = false` não devem gerar nenhum slot.

**Validates: Requirements 3.3**

---

### Property 6: Conversão de timezone — slots em UTC representam corretamente o horário local

*Para qualquer* AvailabilityRule com `startTime` e `endTime` em horário local e qualquer timezone IANA válido, os slots gerados em UTC devem, quando convertidos de volta para o timezone do artista, cair dentro da janela `[startTime, endTime)` da regra.

**Validates: Requirements 8.2**

---

### Property 7: Isolamento de dados públicos — resposta de disponibilidade não contém dados de Appointments

*Para qualquer* resposta do endpoint `GET /public/artists/:artistId/availability`, o payload não deve conter nenhum dos campos: `requesterName`, `requesterEmail`, `requesterPhone`, `notes`, `requestCode` (de outros appointments), `id` de Appointment.

**Validates: Requirements 3.6, 9.1, 9.2**

---

### Property 8: Isolamento de dados públicos — consulta por requestCode retorna apenas campos permitidos

*Para qualquer* Appointment consultado via `GET /public/appointments/:requestCode`, a resposta deve conter apenas os campos `requestCode`, `status`, `startAt`, `endAt` — nunca `requesterName`, `requesterEmail`, `requesterPhone`, `artistId` ou `notes`.

**Validates: Requirements 5.2, 9.2**

---

### Property 9: Idempotência na criação de Appointment

*Para qualquer* combinação de `(artistId, startAt, requesterEmail)`, submeter a mesma solicitação duas vezes deve retornar o mesmo `requestCode` e resultar em exatamente um Appointment no banco de dados.

**Validates: Requirements 4.5**

---

### Property 10: Status inicial de Appointment é sempre PENDING

*Para qualquer* Appointment criado com sucesso via endpoint público, o campo `status` deve ser `PENDING`.

**Validates: Requirements 4.9**

---

### Property 11: Transições de status válidas

*Para qualquer* Appointment com status `S` e qualquer tentativa de transição para status `T`, a transição deve ser aceita se e somente se `(S, T)` pertence ao conjunto `{(PENDING, CONFIRMED), (PENDING, REJECTED), (PENDING, CANCELLED), (CONFIRMED, CANCELLED)}`. Todas as demais combinações devem retornar HTTP 422.

**Validates: Requirements 7.4**

---

### Property 12: Calendário privado retorna apenas Appointments do artista autenticado

*Para qualquer* conjunto de Appointments pertencentes a múltiplos artistas, o endpoint `GET /appointments` de um artista autenticado deve retornar apenas os Appointments cujo `artistId` corresponde ao artista autenticado.

**Validates: Requirements 6.2, 6.4, 9.3**

---

### Property 13: Validação de período máximo de 60 dias

*Para qualquer* requisição (pública ou privada) com período `from`–`to` superior a 60 dias, a API deve retornar HTTP 422.

**Validates: Requirements 3.7, 6.5**

---

### Property 14: Política de antecedência — mínimo 24h, máximo 60 dias

*Para qualquer* `startAt` de solicitação pública, se `startAt < now + 24h` ou `startAt > now + 60 dias`, a API deve rejeitar com HTTP 422.

**Validates: Requirements 4.6, 4.7**

---

## Error Handling

### Códigos HTTP utilizados

| Código | Situação |
|--------|----------|
| 200 | Sucesso (GET, idempotência no POST) |
| 201 | Criação bem-sucedida |
| 204 | Deleção bem-sucedida |
| 400 | Requisição malformada |
| 401 | Token ausente ou inválido |
| 403 | Ownership violation ou role insuficiente |
| 404 | Recurso não encontrado |
| 409 | Conflito de horário no momento do commit |
| 422 | Validação de negócio falhou (datas inválidas, transição inválida, período > 60 dias) |
| 429 | Rate limit excedido |

### Estratégia de Conflito com Transaction

```typescript
// Dentro de prisma.$transaction(async (tx) => { ... })
// 1. Buscar conflitos com SELECT ... FOR UPDATE (lock pessimista)
const conflicts = await tx.appointment.findMany({
  where: {
    artistId,
    status: { in: ['PENDING', 'CONFIRMED'] },
    startAt: { lt: endAt },
    endAt:   { gt: startAt },
  },
})
// 2. Se conflito encontrado → throw → transaction abortada → HTTP 409
if (conflicts.length > 0) throw new ConflictError()
// 3. Criar appointment
await tx.appointment.create({ data: { ... } })
```

### Idempotência

Antes da transaction, verificar se já existe um Appointment com a chave `(artistId, startAt, requesterEmail)` e status `PENDING` ou `CONFIRMED`. Se existir, retornar HTTP 200 com o Appointment existente sem entrar na transaction.

---

## Testing Strategy

### Abordagem Dual

O projeto já usa **Vitest** e **fast-check** (API) e **@fast-check/vitest** (Web). A estratégia segue o padrão estabelecido nos módulos existentes.

#### Testes de Propriedade (fast-check, mínimo 100 iterações)

Cada propriedade do design deve ter um teste de propriedade correspondente. Os testes de propriedade focam na lógica pura do `Availability_Service` (funções `generateSlots` e `filterConflicts`) e nas regras de negócio do `Appointment_Service`.

**Configuração de tag obrigatória:**
```typescript
// Feature: scheduling-system, Property N: <texto da propriedade>
```

**Geradores fast-check relevantes:**
- `fc.record({ startTime: fc.string(), endTime: fc.string() })` para regras
- `fc.date()` para intervalos temporais
- `fc.constantFrom('PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED')` para status
- `fc.emailAddress()` para emails de solicitantes

#### Testes de Exemplo (Vitest)

- Cada controller deve ter testes de exemplo cobrindo o caminho feliz e os principais casos de erro
- Testes de integração para verificar que as rotas estão registradas corretamente
- Testes de componente React com React Testing Library para UI pública e dashboard

#### Testes de Propriedade por Módulo

| Arquivo | Propriedades cobertas |
|---------|----------------------|
| `availability.service.property.test.ts` | P4, P5, P6, P7 |
| `appointments.service.property.test.ts` | P9, P10, P11 |
| `public-scheduling.property.test.ts` | P7, P8, P13, P14 |
| `appointments.ownership.property.test.ts` | P1, P2, P12 |
| `availability.validation.property.test.ts` | P3 |

#### Testes de Exemplo por Módulo

| Arquivo | Cobertura |
|---------|-----------|
| `availability.controller.test.ts` | CRUD de regras e bloqueios, ownership |
| `appointments.controller.test.ts` | Calendário privado, atualização de status |
| `public-scheduling.controller.test.ts` | Disponibilidade pública, criação de solicitação, consulta por requestCode |

### Nota sobre PBT e I/O

As funções `generateSlots` e `filterConflicts` são **funções puras** (sem I/O), tornando-as ideais para property-based testing. Os testes de propriedade para serviços com I/O (criação de Appointment) usam mocks do Prisma para manter os testes rápidos e determinísticos.
