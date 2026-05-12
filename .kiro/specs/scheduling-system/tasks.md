# Implementation Plan: Sistema de Agendamento

## Overview

Implementação incremental do sistema de agendamento em 8 fases. A API Fastify recebe os novos módulos `availability`, `appointments` e `public-scheduling`. O frontend Next.js recebe a UI pública de agendamento e o dashboard de calendário. A lógica de cálculo de slots é implementada como funções puras para facilitar os testes de propriedade.

---

## Tasks

- [x] 1. Fase A — Prisma schema e migration
  - Adicionar campo `timezone String @default("America/Sao_Paulo")` ao model `Artist` em `apps/api/prisma/schema.prisma`
  - Adicionar enum `AppointmentStatus` com valores `PENDING`, `CONFIRMED`, `CANCELLED`, `REJECTED`
  - Adicionar models `AvailabilityRule`, `AvailabilityBlock` e `Appointment` conforme design
  - Adicionar `@@unique([artistId, startAt, requesterEmail], name: "idempotency_key")` em `Appointment`
  - Adicionar relações inversas em `Artist` para os três novos models
  - Criar arquivo de migration SQL em `apps/api/migrations/010_create_scheduling.sql`
  - _Requirements: 1.5, 2.5, 4.4, 8.1_

- [x] 2. Fase B — Módulo de disponibilidade privado (regras e bloqueios)
  - [x] 2.1 Criar `apps/api/src/modules/availability/availability.schemas.ts`
    - Schema Zod `CreateAvailabilityRuleSchema`: `weekday` (0–6), `startTime` (regex `HH:MM`), `endTime` (regex `HH:MM`), `slotMinutes` (int positivo), `active` (boolean, default true)
    - Schema Zod `UpdateAvailabilityRuleSchema`: todos os campos opcionais
    - Schema Zod `CreateAvailabilityBlockSchema`: `startAt` (ISO 8601), `endAt` (ISO 8601), `reason` (string opcional)
    - Schema Zod `UpdateAvailabilityBlockSchema`: todos os campos opcionais
    - Validação de negócio: `startTime < endTime` e `startAt < endAt`
    - _Requirements: 1.5, 1.6, 2.5, 2.6_

  - [x] 2.2 Criar `apps/api/src/modules/availability/availability.repository.ts`
    - `findRulesByArtist(artistId)` — busca regras ativas e inativas do artista
    - `findRuleById(id)` — retorna `{ id, artistId }` para verificação de ownership
    - `createRule(artistId, data)` — cria regra associada ao artista
    - `updateRule(id, artistId, data)` — atualiza com double-check de ownership no `where`
    - `deleteRule(id, artistId)` — deleta com double-check de ownership
    - `findBlocksByArtist(artistId)` — busca bloqueios do artista
    - `findBlockById(id)` — retorna `{ id, artistId }` para ownership
    - `createBlock(artistId, data)` — cria bloqueio
    - `updateBlock(id, artistId, data)` — atualiza com ownership
    - `deleteBlock(id, artistId)` — deleta com ownership
    - _Requirements: 1.2, 1.3, 2.2, 2.3_

  - [x] 2.3 Criar `apps/api/src/modules/availability/availability.controller.ts`
    - `getRulesHandler` — GET `/availability-rules`, retorna regras do artista autenticado
    - `createRuleHandler` — POST `/availability-rules`, valida schema, cria regra
    - `updateRuleHandler` — PATCH `/availability-rules/:id`, verifica ownership, atualiza
    - `deleteRuleHandler` — DELETE `/availability-rules/:id`, verifica ownership, deleta
    - `getBlocksHandler` — GET `/availability-blocks`
    - `createBlockHandler` — POST `/availability-blocks`
    - `updateBlockHandler` — PATCH `/availability-blocks/:id`
    - `deleteBlockHandler` — DELETE `/availability-blocks/:id`
    - Todos os handlers extraem `artistId` de `request.user as AuthContext`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

  - [x] 2.4 Criar `apps/api/src/modules/availability/availability.routes.ts`
    - Registrar todas as 8 rotas com `preHandler: authenticate`
    - _Requirements: 1.1, 2.1_

  - [x] 2.5 Escrever testes de exemplo para o módulo de disponibilidade privado
    - `apps/api/src/modules/availability/availability.controller.test.ts`
    - Testar criação de regra com dados válidos → 201
    - Testar criação com `startTime >= endTime` → 422
    - Testar atualização de regra de outro artista → 403
    - Testar deleção de regra de outro artista → 403
    - Testar criação de bloqueio com `startAt >= endAt` → 422
    - _Requirements: 1.3, 1.4, 1.6, 2.3, 2.4, 2.6_

  - [x] 2.6 Escrever testes de propriedade — ownership e validação temporal
    - `apps/api/src/modules/availability/availability.validation.property.test.ts`
    - **Property 1: Ownership invariant — criação sempre associa ao artista autenticado**
    - **Validates: Requirements 1.2, 2.2**
    - **Property 2: Ownership enforcement — artista não acessa recursos de outro artista**
    - **Validates: Requirements 1.3, 2.3**
    - **Property 3: Validação temporal — startTime/startAt deve ser anterior a endTime/endAt**
    - **Validates: Requirements 1.6, 2.6**
    - _Requirements: 1.2, 1.3, 1.6, 2.2, 2.3, 2.6_

- [x] 3. Checkpoint — Verificar que módulo de disponibilidade privado compila e testes passam
  - Garantir que `tsc --noEmit` não reporta erros em `apps/api/`
  - Garantir que `vitest --run` passa todos os testes do módulo `availability`
  - Perguntar ao usuário se há dúvidas antes de prosseguir.

- [x] 4. Fase C — Serviço de cálculo de slots livres (lógica pura)
  - [x] 4.1 Criar `apps/api/src/modules/availability/availability.service.ts`
    - Implementar `generateSlots(rules, from, to, timezone): Slot[]`
      - Para cada dia no período `[from, to]`, verificar se o `weekday` corresponde a alguma regra ativa
      - Converter `startTime`/`endTime` da regra para UTC usando o timezone do artista
      - Gerar slots de `slotMinutes` minutos dentro da janela convertida
    - Implementar `filterConflicts(slots, occupied): Slot[]`
      - Remover slots onde `slot.startAt < occupied.endAt AND slot.endAt > occupied.startAt`
    - Usar biblioteca `date-fns-tz` (já disponível via `date-fns`) para conversão de timezone
    - Funções devem ser **puras** (sem I/O, sem efeitos colaterais)
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 8.2, 8.3_

  - [x] 4.2 Escrever testes de propriedade para o serviço de disponibilidade
    - `apps/api/src/modules/availability/availability.service.property.test.ts`
    - **Property 4: Conflito de slots — slots ocupados nunca aparecem na disponibilidade pública**
    - **Validates: Requirements 3.4, 3.5**
    - **Property 5: Geração de slots respeita regras ativas**
    - **Validates: Requirements 3.3**
    - **Property 6: Conversão de timezone — slots em UTC representam corretamente o horário local**
    - **Validates: Requirements 8.2**
    - Configurar `fc.configureGlobal({ numRuns: 100 })`
    - _Requirements: 3.3, 3.4, 3.5, 8.2_

- [x] 5. Fase D — Módulo de agendamentos privados
  - [x] 5.1 Criar `apps/api/src/modules/appointments/appointments.schemas.ts`
    - `CreateAppointmentSchema` (para uso interno/admin): campos completos
    - `UpdateAppointmentStatusSchema`: `status` com enum `AppointmentStatus`
    - `AppointmentQuerySchema`: `from` e `to` (YYYY-MM-DD), validar período ≤ 60 dias
    - _Requirements: 6.5, 7.4_

  - [x] 5.2 Criar `apps/api/src/modules/appointments/appointments.repository.ts`
    - `findByArtistAndPeriod(artistId, from, to)` — busca todos os appointments do artista no período
    - `findById(id)` — retorna `{ id, artistId, status }` para ownership e validação de transição
    - `updateStatus(id, artistId, newStatus)` — atualiza com double-check de ownership
    - `remove(id, artistId)` — deleta com double-check de ownership
    - `findConflicts(artistId, startAt, endAt, tx?)` — busca conflitos dentro de transaction
    - _Requirements: 6.2, 6.4, 7.2, 7.7_

  - [x] 5.3 Criar `apps/api/src/modules/appointments/appointments.service.ts`
    - Implementar `updateStatus(id, artistId, newStatus)` com validação de transição
    - Mapa de transições válidas: `PENDING→CONFIRMED`, `PENDING→REJECTED`, `PENDING→CANCELLED`, `CONFIRMED→CANCELLED`
    - Retornar erro se transição inválida
    - _Requirements: 7.4, 7.5_

  - [x] 5.4 Criar `apps/api/src/modules/appointments/appointments.controller.ts`
    - `getAppointmentsHandler` — GET `/appointments?from&to`, retorna calendário completo
    - `updateStatusHandler` — PATCH `/appointments/:id/status`, valida ownership e transição
    - `deleteAppointmentHandler` — DELETE `/appointments/:id`, valida ownership
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.6, 7.7_

  - [x] 5.5 Criar `apps/api/src/modules/appointments/appointments.routes.ts`
    - Registrar as 3 rotas com `preHandler: authenticate`
    - _Requirements: 6.1, 7.1, 7.6_

  - [x] 5.6 Escrever testes de exemplo para o módulo de appointments privados
    - `apps/api/src/modules/appointments/appointments.controller.test.ts`
    - Testar GET calendário retorna apenas appointments do artista autenticado
    - Testar PATCH status com transição válida → 200
    - Testar PATCH status com transição inválida → 422
    - Testar PATCH status de appointment de outro artista → 403
    - Testar DELETE de appointment de outro artista → 403
    - _Requirements: 6.4, 7.2, 7.4, 7.7_

  - [x] 5.7 Escrever testes de propriedade — ownership e transições de status
    - `apps/api/src/modules/appointments/appointments.ownership.property.test.ts`
    - **Property 2: Ownership enforcement — artista não acessa recursos de outro artista**
    - **Validates: Requirements 7.2, 9.5**
    - **Property 11: Transições de status válidas**
    - **Validates: Requirements 7.4**
    - **Property 12: Calendário privado retorna apenas Appointments do artista autenticado**
    - **Validates: Requirements 6.2, 6.4, 9.3**
    - _Requirements: 6.4, 7.2, 7.4, 9.3_

- [x] 6. Fase E — Módulo público de agendamento
  - [x] 6.1 Criar `apps/api/src/modules/public-scheduling/public-scheduling.schemas.ts`
    - `PublicAvailabilityQuerySchema`: `from`, `to` (YYYY-MM-DD), validar período ≤ 60 dias
    - `PublicCreateAppointmentSchema`: `requesterName`, `requesterEmail`, `requesterPhone?`, `serviceId?`, `startAt`, `endAt`, `notes?`
    - `PublicAppointmentResponseSchema`: apenas `requestCode`, `status`, `startAt`, `endAt` (sem PII)
    - _Requirements: 3.7, 4.6, 4.7, 5.2_

  - [x] 6.2 Criar `apps/api/src/modules/public-scheduling/public-scheduling.service.ts`
    - `getPublicAvailability(artistId, from, to)`:
      1. Buscar artista (timezone)
      2. Buscar AvailabilityRules ativas
      3. Chamar `generateSlots(rules, from, to, timezone)`
      4. Buscar Appointments PENDING/CONFIRMED no período
      5. Buscar AvailabilityBlocks no período
      6. Chamar `filterConflicts(slots, [...appointments, ...blocks])`
      7. Retornar `{ artistId, timezone, slots }`
    - `createPublicAppointment(artistId, data)`:
      1. Validar antecedência (24h mínimo, 60 dias máximo)
      2. Verificar idempotência por `(artistId, startAt, requesterEmail)`
      3. Executar `prisma.$transaction` com revalidação de conflito antes do INSERT
      4. Retornar Appointment com `requestCode`
    - `getAppointmentByRequestCode(requestCode)`: retorna apenas campos públicos
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 4.2, 4.3, 4.5, 4.6, 4.7, 5.2, 5.3_

  - [x] 6.3 Criar `apps/api/src/modules/public-scheduling/public-scheduling.controller.ts`
    - `getPublicAvailabilityHandler` — sem autenticação, chama `getPublicAvailability`
    - `createPublicAppointmentHandler` — sem autenticação, chama `createPublicAppointment`
    - `getPublicAppointmentStatusHandler` — sem autenticação, chama `getAppointmentByRequestCode`
    - Nenhum handler deve expor campos de PII de terceiros na resposta
    - _Requirements: 3.1, 4.1, 5.1, 9.1, 9.2_

  - [x] 6.4 Criar `apps/api/src/modules/public-scheduling/public-scheduling.routes.ts`
    - Registrar as 3 rotas **sem** `preHandler: authenticate`
    - Aplicar rate limit mais restritivo em `POST /public/artists/:artistId/appointments`
    - _Requirements: 3.1, 4.1, 4.8, 5.1_

  - [x] 6.5 Registrar os três novos módulos em `apps/api/src/app.ts`
    - Importar e registrar `availabilityRoutes`, `appointmentsRoutes`, `publicSchedulingRoutes`
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_

  - [x] 6.6 Escrever testes de exemplo para o módulo público
    - `apps/api/src/modules/public-scheduling/public-scheduling.controller.test.ts`
    - Testar GET disponibilidade sem auth → 200 com lista de slots
    - Testar GET disponibilidade sem regras ativas → 200 com lista vazia
    - Testar GET disponibilidade com período > 60 dias → 422
    - Testar POST solicitação com slot disponível → 201 com requestCode
    - Testar POST solicitação com slot ocupado → 409
    - Testar POST solicitação com startAt < 24h → 422
    - Testar POST solicitação com startAt > 60 dias → 422
    - Testar POST idempotente (mesmo artistId+startAt+email) → 200 com mesmo requestCode
    - Testar GET por requestCode válido → 200 sem PII
    - Testar GET por requestCode inválido → 404
    - _Requirements: 3.7, 3.8, 4.3, 4.5, 4.6, 4.7, 5.3_

  - [x] 6.7 Escrever testes de propriedade para o módulo público
    - `apps/api/src/modules/public-scheduling/public-scheduling.property.test.ts`
    - **Property 7: Isolamento de dados públicos — resposta de disponibilidade não contém dados de Appointments**
    - **Validates: Requirements 3.6, 9.1, 9.2**
    - **Property 8: Isolamento de dados públicos — consulta por requestCode retorna apenas campos permitidos**
    - **Validates: Requirements 5.2, 9.2**
    - **Property 9: Idempotência na criação de Appointment**
    - **Validates: Requirements 4.5**
    - **Property 10: Status inicial de Appointment é sempre PENDING**
    - **Validates: Requirements 4.9**
    - **Property 13: Validação de período máximo de 60 dias**
    - **Validates: Requirements 3.7, 6.5**
    - **Property 14: Política de antecedência — mínimo 24h, máximo 60 dias**
    - **Validates: Requirements 4.6, 4.7**
    - _Requirements: 3.6, 3.7, 4.5, 4.6, 4.7, 4.9, 5.2, 6.5, 9.1, 9.2_

- [x] 7. Checkpoint — Verificar que toda a API compila e testes passam
  - Garantir que `tsc --noEmit` não reporta erros em `apps/api/`
  - Garantir que `vitest --run` passa todos os testes da API
  - Verificar que nenhum endpoint público expõe campos de PII
  - Perguntar ao usuário se há dúvidas antes de prosseguir para o frontend.

- [x] 8. Fase F — UI pública de agendamento
  - [x] 8.1 Criar componente `AvailabilityCalendar` em `apps/web/src/components/scheduling/`
    - Calendário mensal que destaca apenas dias com slots disponíveis
    - Recebe `slots: Slot[]` e `timezone: string` como props
    - Ao clicar em um dia disponível, emite o dia selecionado via callback `onDaySelect`
    - _Requirements: 10.1_

  - [x] 8.2 Criar componente `SlotPicker`
    - Lista os horários livres do dia selecionado
    - Exibe horários no timezone do artista (usando `timezone` da resposta da API)
    - Ao selecionar um horário, emite o slot via callback `onSlotSelect`
    - _Requirements: 10.2_

  - [x] 8.3 Criar componente `AppointmentForm`
    - Campos: nome (obrigatório), email (obrigatório), telefone (opcional), observações (opcional)
    - Ao submeter, chama `POST /public/artists/:artistId/appointments`
    - Em caso de sucesso, exibe `requestCode` e status `PENDING`
    - Em caso de conflito (409), exibe mensagem de horário indisponível
    - _Requirements: 10.3, 10.4_

  - [x] 8.4 Criar componente `StatusChecker`
    - Campo de texto para inserir `requestCode`
    - Ao submeter, chama `GET /public/appointments/:requestCode`
    - Exibe status, `startAt` e `endAt` formatados no timezone do artista
    - _Requirements: 10.5_

  - [x] 8.5 Integrar componentes na página pública do artista
    - Adicionar seção de agendamento em `apps/web/src/app/[artistSlug]/page.tsx` (ou componente dedicado)
    - Buscar disponibilidade ao carregar a página (próximos 30 dias)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 8.6 Escrever testes de componente para UI pública
    - Testar `AvailabilityCalendar` renderiza dias disponíveis corretamente
    - Testar `AppointmentForm` submete dados e exibe requestCode
    - Testar `StatusChecker` exibe status ao consultar requestCode válido
    - _Requirements: 10.1, 10.3, 10.4, 10.5_

- [x] 9. Fase G — UI dashboard de calendário
  - [x] 9.1 Criar componente `CalendarView` em `apps/web/src/components/dashboard/`
    - Calendário com navegação por mês, semana e dia
    - Busca appointments via `GET /appointments?from=&to=` ao navegar
    - Exibe horários no timezone do artista autenticado
    - _Requirements: 11.1, 11.5_

  - [x] 9.2 Criar componente `AppointmentCard`
    - Exibe nome do solicitante, serviço (se houver) e status com badge colorido
    - Ao clicar, abre painel de detalhes com ações disponíveis
    - _Requirements: 11.2_

  - [x] 9.3 Criar componente `StatusActions`
    - Botões contextuais baseados no status atual do Appointment
    - `PENDING`: botões Confirmar, Rejeitar, Cancelar
    - `CONFIRMED`: botão Cancelar
    - Ao clicar, chama `PATCH /appointments/:id/status`
    - Atualiza estado local imediatamente após resposta 200 (sem reload)
    - _Requirements: 11.3, 11.4_

  - [x] 9.4 Criar página `apps/web/src/app/dashboard/calendar/page.tsx`
    - Server Component que renderiza `CalendarView`
    - Protegida por autenticação (redireciona para login se não autenticado)
    - _Requirements: 11.1_

  - [x] 9.5 Escrever testes de componente para dashboard
    - Testar `CalendarView` renderiza appointments com nome, serviço e status
    - Testar `StatusActions` exibe botões corretos para cada status
    - Testar `StatusActions` chama endpoint correto ao confirmar/rejeitar/cancelar
    - _Requirements: 11.2, 11.3, 11.4_

- [x] 10. Checkpoint final — Verificar build completo e todos os testes
  - Garantir que `tsc --noEmit` não reporta erros em `apps/api/` e `apps/web/`
  - Garantir que `vitest --run` passa todos os testes em ambos os apps
  - Verificar que nenhum componente público importa de módulos do dashboard
  - Perguntar ao usuário se há ajustes antes de encerrar.

---

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- A lógica de `generateSlots` e `filterConflicts` deve ser implementada como funções puras para facilitar os testes de propriedade (sem dependência de Prisma)
- O `artistId` em rotas privadas vem **sempre** de `request.user as AuthContext` — nunca do body ou params
- A chave de idempotência `(artistId, startAt, requesterEmail)` é implementada como `@@unique` no Prisma e verificada antes da transaction
- Rate limit do endpoint público de criação deve ser configurado em `public-scheduling.routes.ts` usando `@fastify/rate-limit` já instalado
- Usar `date-fns-tz` para conversão de timezone (verificar se já está no `package.json`; se não, instalar)
- Testes de propriedade usam `fast-check` (já instalado em `apps/api`) com mínimo 100 iterações
- Testes de componente web usam `@testing-library/react` e `@fast-check/vitest` (já instalados em `apps/web`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4"] },
    { "id": 3, "tasks": ["2.5", "2.6", "3"] },
    { "id": 4, "tasks": ["4.1"] },
    { "id": 5, "tasks": ["4.2", "5.1", "5.2"] },
    { "id": 6, "tasks": ["5.3", "5.4", "5.5"] },
    { "id": 7, "tasks": ["5.6", "5.7", "6.1", "6.2"] },
    { "id": 8, "tasks": ["6.3", "6.4"] },
    { "id": 9, "tasks": ["6.5"] },
    { "id": 10, "tasks": ["6.6", "6.7", "7"] },
    { "id": 11, "tasks": ["8.1", "8.2", "8.3", "8.4"] },
    { "id": 12, "tasks": ["8.5"] },
    { "id": 13, "tasks": ["8.6", "9.1", "9.2", "9.3"] },
    { "id": 14, "tasks": ["9.4"] },
    { "id": 15, "tasks": ["9.5", "10"] }
  ]
}
```
