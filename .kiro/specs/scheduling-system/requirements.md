# Requirements Document

## Introduction

Sistema de agendamento para o Hub, permitindo que usuários públicos solicitem atendimentos com artistas/tatuadores e que clientes autenticados gerenciem sua agenda completa. O sistema garante que horários ocupados nunca sejam expostos ao público, protegendo a privacidade dos solicitantes e a integridade da agenda do artista.

## Glossary

- **Scheduling_System**: O sistema de agendamento descrito neste documento
- **Availability_Service**: Serviço responsável por calcular slots livres a partir de regras, bloqueios e agendamentos existentes
- **Appointment_Service**: Serviço responsável por criar e gerenciar solicitações de agendamento
- **Public_API**: Endpoints sem autenticação acessíveis por qualquer usuário
- **Private_API**: Endpoints protegidos pelo hook `authenticate`, acessíveis apenas por artistas autenticados
- **Artist**: Usuário autenticado com `role = artist` ou `admin`, dono de uma agenda
- **Requester**: Usuário público (não autenticado) que solicita um atendimento
- **AvailabilityRule**: Regra recorrente semanal que define os horários de trabalho do artista
- **AvailabilityBlock**: Bloqueio pontual de um intervalo de tempo na agenda do artista
- **Appointment**: Solicitação de atendimento criada por um Requester
- **Slot**: Intervalo de tempo livre calculado a partir das AvailabilityRules, descontando Appointments e AvailabilityBlocks
- **AppointmentStatus**: Estado de um Appointment — `PENDING`, `CONFIRMED`, `CANCELLED`, `REJECTED`
- **requestCode**: UUID único gerado no momento da criação do Appointment, usado pelo Requester para consultar o status da própria solicitação
- **Conflict**: Sobreposição temporal entre dois intervalos — ocorre quando `slot.startAt < other.endAt AND slot.endAt > other.startAt`
- **Timezone**: Fuso horário do artista (ex: `America/Sao_Paulo`), armazenado no model `Artist`

---

## Requirements

### Requirement 1: Gerenciamento de Regras de Disponibilidade

**User Story:** Como artista autenticado, quero configurar meus horários de trabalho semanais, para que o sistema saiba quando estou disponível para atendimentos.

#### Acceptance Criteria

1. THE Private_API SHALL expor endpoints CRUD para AvailabilityRule sob o prefixo `/availability-rules`
2. WHEN um artista autenticado cria uma AvailabilityRule, THE Availability_Service SHALL associar a regra ao `artistId` extraído do token JWT — nunca do body da requisição
3. WHEN um artista autenticado atualiza ou deleta uma AvailabilityRule, THE Private_API SHALL verificar que a regra pertence ao artista autenticado antes de aplicar a modificação
4. IF uma AvailabilityRule não pertence ao artista autenticado, THEN THE Private_API SHALL retornar HTTP 403
5. THE AvailabilityRule SHALL conter os campos: `weekday` (0–6), `startTime` (formato `HH:MM`), `endTime` (formato `HH:MM`), `slotMinutes` (inteiro positivo) e `active` (booleano)
6. WHEN `startTime >= endTime`, THE Private_API SHALL rejeitar a criação ou atualização com HTTP 422

### Requirement 2: Gerenciamento de Bloqueios de Agenda

**User Story:** Como artista autenticado, quero bloquear intervalos específicos na minha agenda, para que esses períodos não apareçam como disponíveis para o público.

#### Acceptance Criteria

1. THE Private_API SHALL expor endpoints CRUD para AvailabilityBlock sob o prefixo `/availability-blocks`
2. WHEN um artista autenticado cria um AvailabilityBlock, THE Availability_Service SHALL associar o bloqueio ao `artistId` extraído do token JWT
3. WHEN um artista autenticado atualiza ou deleta um AvailabilityBlock, THE Private_API SHALL verificar que o bloqueio pertence ao artista autenticado
4. IF um AvailabilityBlock não pertence ao artista autenticado, THEN THE Private_API SHALL retornar HTTP 403
5. THE AvailabilityBlock SHALL conter os campos: `startAt` (DateTime ISO 8601), `endAt` (DateTime ISO 8601) e `reason` (string opcional)
6. WHEN `startAt >= endAt`, THE Private_API SHALL rejeitar a criação ou atualização com HTTP 422

### Requirement 3: Consulta Pública de Slots Disponíveis

**User Story:** Como usuário público, quero ver os horários disponíveis de um artista, para que eu possa escolher um horário para solicitar atendimento.

#### Acceptance Criteria

1. THE Public_API SHALL expor `GET /public/artists/:artistId/availability?from=YYYY-MM-DD&to=YYYY-MM-DD` sem exigir autenticação
2. WHEN a Public_API recebe uma requisição de disponibilidade, THE Availability_Service SHALL calcular os slots livres respeitando o timezone do artista
3. THE Availability_Service SHALL gerar slots a partir das AvailabilityRules ativas do artista para o período `from`–`to`
4. THE Availability_Service SHALL remover slots que conflitam com Appointments de status `PENDING` ou `CONFIRMED`
5. THE Availability_Service SHALL remover slots que conflitam com AvailabilityBlocks do artista
6. THE Public_API SHALL retornar apenas os slots livres — nunca dados de Appointments existentes, nomes de solicitantes ou qualquer informação pessoal de terceiros
7. WHEN o período `from`–`to` excede 60 dias, THE Public_API SHALL retornar HTTP 422
8. WHEN o artista não possui AvailabilityRules ativas, THE Public_API SHALL retornar lista vazia de slots

### Requirement 4: Solicitação Pública de Agendamento

**User Story:** Como usuário público, quero solicitar um atendimento em um horário disponível, para que o artista possa confirmar ou rejeitar minha solicitação.

#### Acceptance Criteria

1. THE Public_API SHALL expor `POST /public/artists/:artistId/appointments` sem exigir autenticação
2. WHEN um Requester envia uma solicitação, THE Appointment_Service SHALL criar o Appointment dentro de uma transaction com revalidação de conflito imediatamente antes do commit
3. IF o slot solicitado conflita com outro Appointment (`PENDING` ou `CONFIRMED`) ou AvailabilityBlock no momento do commit, THEN THE Appointment_Service SHALL abortar a transaction e retornar HTTP 409
4. THE Appointment_Service SHALL gerar um `requestCode` UUID único para cada Appointment criado com sucesso
5. WHEN o mesmo `artistId + startAt + requesterEmail` já existe com status `PENDING` ou `CONFIRMED`, THE Appointment_Service SHALL retornar o Appointment existente com HTTP 200 (idempotência)
6. WHEN `startAt` está a menos de 24 horas do momento atual, THE Public_API SHALL rejeitar a solicitação com HTTP 422
7. WHEN `startAt` está a mais de 60 dias do momento atual, THE Public_API SHALL rejeitar a solicitação com HTTP 422
8. THE Public_API SHALL aplicar rate limit mais restritivo neste endpoint em relação aos demais endpoints públicos
9. THE Appointment criado SHALL ter status inicial `PENDING`
10. THE Public_API SHALL retornar o `requestCode` na resposta de criação bem-sucedida

### Requirement 5: Consulta Pública de Status de Solicitação

**User Story:** Como usuário público, quero consultar o status da minha solicitação usando o código recebido, para que eu saiba se meu atendimento foi confirmado ou rejeitado.

#### Acceptance Criteria

1. THE Public_API SHALL expor `GET /public/appointments/:requestCode` sem exigir autenticação
2. WHEN um Requester consulta pelo `requestCode`, THE Public_API SHALL retornar apenas o status, `startAt`, `endAt` e `requestCode` do Appointment — nunca dados de outros solicitantes
3. IF o `requestCode` não corresponde a nenhum Appointment, THEN THE Public_API SHALL retornar HTTP 404
4. THE Public_API SHALL retornar HTTP 200 com os dados do Appointment quando o `requestCode` for válido

### Requirement 6: Calendário Privado do Artista

**User Story:** Como artista autenticado, quero visualizar todos os meus agendamentos em um calendário completo, para que eu possa gerenciar minha agenda com visibilidade total.

#### Acceptance Criteria

1. THE Private_API SHALL expor `GET /appointments?from=YYYY-MM-DD&to=YYYY-MM-DD` protegido pelo hook `authenticate`
2. WHEN um artista autenticado consulta o calendário, THE Private_API SHALL retornar todos os Appointments do artista no período, independentemente do status
3. THE Private_API SHALL incluir nos Appointments retornados: `id`, `requesterName`, `requesterEmail`, `requesterPhone`, `serviceId`, `startAt`, `endAt`, `status`, `notes`, `requestCode`
4. THE Private_API SHALL filtrar os Appointments pelo `artistId` extraído do token JWT — nunca por parâmetro do body ou query string
5. WHEN o período `from`–`to` excede 60 dias, THE Private_API SHALL retornar HTTP 422

### Requirement 7: Gerenciamento de Status de Agendamentos

**User Story:** Como artista autenticado, quero confirmar, rejeitar ou cancelar solicitações de agendamento, para que eu possa controlar minha agenda.

#### Acceptance Criteria

1. THE Private_API SHALL expor `PATCH /appointments/:id/status` protegido pelo hook `authenticate`
2. WHEN um artista autenticado atualiza o status de um Appointment, THE Private_API SHALL verificar que o Appointment pertence ao artista autenticado
3. IF o Appointment não pertence ao artista autenticado, THEN THE Private_API SHALL retornar HTTP 403
4. THE Private_API SHALL aceitar apenas as transições de status: `PENDING → CONFIRMED`, `PENDING → REJECTED`, `CONFIRMED → CANCELLED`, `PENDING → CANCELLED`
5. IF a transição de status solicitada não é permitida, THEN THE Private_API SHALL retornar HTTP 422
6. THE Private_API SHALL expor `DELETE /appointments/:id` protegido pelo hook `authenticate`
7. WHEN um artista autenticado deleta um Appointment, THE Private_API SHALL verificar que o Appointment pertence ao artista autenticado antes de remover

### Requirement 8: Integridade Temporal e Timezone

**User Story:** Como artista autenticado, quero que todos os cálculos de horário respeitem meu fuso horário configurado, para que os agendamentos sejam exibidos corretamente para mim e para os solicitantes.

#### Acceptance Criteria

1. THE Artist model SHALL conter o campo `timezone` (string IANA, ex: `America/Sao_Paulo`) com valor padrão `America/Sao_Paulo`
2. WHEN o Availability_Service gera slots, THE Availability_Service SHALL converter os horários das AvailabilityRules para UTC usando o timezone do artista
3. WHEN o Availability_Service verifica conflitos, THE Availability_Service SHALL comparar todos os intervalos em UTC
4. THE Appointment_Service SHALL armazenar `startAt` e `endAt` em UTC no banco de dados
5. WHEN a Public_API retorna slots disponíveis, THE Public_API SHALL incluir o timezone do artista na resposta para que o cliente possa exibir os horários corretamente

### Requirement 9: Segurança e Isolamento de Dados

**User Story:** Como usuário público, quero ter garantia de que não consigo acessar dados de outros solicitantes, para que minha privacidade e a dos demais seja preservada.

#### Acceptance Criteria

1. THE Public_API SHALL nunca retornar dados de Appointments em endpoints de disponibilidade
2. THE Public_API SHALL nunca expor `requesterName`, `requesterEmail` ou `requesterPhone` de terceiros em nenhum endpoint público
3. WHEN um artista autenticado acessa o calendário, THE Private_API SHALL retornar apenas Appointments do próprio artista autenticado
4. THE Private_API SHALL extrair o `artistId` exclusivamente do token JWT em todas as operações de escrita e leitura de dados sensíveis
5. IF uma requisição autenticada tenta acessar recursos de outro artista, THEN THE Private_API SHALL retornar HTTP 403

### Requirement 10: UI Pública de Agendamento

**User Story:** Como usuário público, quero uma interface simples para visualizar horários disponíveis e solicitar atendimento, para que o processo seja intuitivo e acessível.

#### Acceptance Criteria

1. THE Web_App SHALL exibir um calendário com os dias que possuem slots disponíveis na página pública do artista
2. WHEN um usuário seleciona um dia com slots disponíveis, THE Web_App SHALL exibir os horários livres daquele dia
3. WHEN um usuário seleciona um horário, THE Web_App SHALL exibir um formulário com campos: nome, email, telefone (opcional) e observações (opcional)
4. WHEN a solicitação é enviada com sucesso, THE Web_App SHALL exibir o `requestCode` e o status `PENDING` para o usuário
5. THE Web_App SHALL permitir que o usuário consulte o status da solicitação informando o `requestCode`

### Requirement 11: UI Dashboard de Calendário

**User Story:** Como artista autenticado, quero um dashboard de calendário com visão completa dos meus agendamentos, para que eu possa gerenciar minha agenda de forma eficiente.

#### Acceptance Criteria

1. THE Web_App SHALL exibir um calendário no dashboard com navegação por mês, semana e dia
2. WHEN o artista visualiza o calendário, THE Web_App SHALL exibir nome do solicitante, serviço (se houver) e status de cada Appointment
3. THE Web_App SHALL permitir que o artista confirme, rejeite ou cancele um Appointment diretamente pelo calendário
4. WHEN o artista altera o status de um Appointment, THE Web_App SHALL atualizar a exibição imediatamente sem recarregar a página
5. THE Web_App SHALL exibir os horários dos Appointments no timezone do artista autenticado
