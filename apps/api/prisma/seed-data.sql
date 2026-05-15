-- ============================================================
-- SEED: Dados de demonstração do Marketplace
-- Rode DEPOIS do full-setup.sql
-- ============================================================

-- 1. Criar usuário no auth.users (necessário para FK)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, aud, role, created_at, updated_at, confirmation_token, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'demo@lonassaopaulo.com.br',
  '$2a$10$PwGnSxVF3OjLsHXqtEu5SOPfGRoFOkKjSHERJUgrFvjMJCIqvLrMy', -- demo123456
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false
)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar na tabela public.users
INSERT INTO public.users (id, email, role, password)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'demo@lonassaopaulo.com.br',
  'artist',
  '$2a$10$PwGnSxVF3OjLsHXqtEu5SOPfGRoFOkKjSHERJUgrFvjMJCIqvLrMy'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Criar artista
INSERT INTO public.artists (id, user_id, name, slug, profile_type, tagline, bio, location, email, whatsapp, skills, tools, is_active, timezone)
VALUES (
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Lonas São Paulo',
  'lonas-sao-paulo',
  'musician',
  'Toldos, capotas e coberturas sob medida desde 2005',
  ARRAY['Fabricação própria de toldos, capotas náuticas, coberturas para eventos e lonas industriais.', 'Atendemos todo o estado de São Paulo com entrega e instalação.'],
  'São Paulo, SP',
  'contato@lonassaopaulo.com.br',
  '11999887766',
  ARRAY['Toldos Retráteis', 'Capotas Náuticas', 'Coberturas', 'Lonas Industriais'],
  ARRAY['Lona Vinílica', 'Lona Acrílica', 'Policarbonato', 'Alumínio'],
  true,
  'America/Sao_Paulo'
)
ON CONFLICT (id) DO NOTHING;

-- Atualizar artist_id no users
UPDATE public.users SET artist_id = 'b0000000-0000-4000-8000-000000000001' WHERE id = 'a0000000-0000-4000-8000-000000000001';

-- 4. Criar categorias
INSERT INTO public.marketplace_categories (id, artist_id, name, slug, icon, sort_order) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Toldos', 'toldos', '☀️', 0),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Capotas Náuticas', 'capotas-nauticas', '⛵', 1),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Coberturas para Eventos', 'coberturas-para-eventos', '🎪', 2),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'Lonas Industriais', 'lonas-industriais', '🏭', 3)
ON CONFLICT DO NOTHING;

-- 5. Criar produtos
INSERT INTO public.marketplace_products (id, artist_id, category_id, title, slug, description, short_description, type, base_price, active, featured, customizable, stock, width_cm, height_cm, material, color, sort_order) VALUES
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'Toldo Retrátil Articulado', 'toldo-retratil-articulado',
   'Toldo retrátil com braços articulados em alumínio, ideal para varandas, sacadas e fachadas comerciais. Lona acrílica importada com proteção UV e impermeabilização. Acionamento manual com manivela ou motorizado.',
   'Toldo articulado em alumínio com lona acrílica UV',
   'QUOTE_ONLY', NULL, true, true, true, NULL, 300, 250, 'Lona Acrílica + Alumínio', 'Diversas cores disponíveis', 0),

  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001',
   'Toldo Fixo Policarbonato', 'toldo-fixo-policarbonato',
   'Toldo fixo com estrutura em alumínio e cobertura em policarbonato alveolar. Excelente para garagens, entradas e áreas de serviço. Alta resistência a impactos e proteção contra raios UV.',
   'Toldo fixo com policarbonato alveolar e alumínio',
   'FIXED_PRICE', 1890.00, true, true, false, 15, 200, 100, 'Policarbonato Alveolar + Alumínio', 'Bronze / Cristal', 1),

  ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002',
   'Capota para Lancha até 22 pés', 'capota-lancha-22-pes',
   'Capota náutica sob medida para lanchas de até 22 pés. Confeccionada em lona náutica Aqualon com tratamento anti-mofo e proteção UV. Estrutura em aço inox 316L.',
   'Capota náutica em Aqualon para lanchas até 22 pés',
   'QUOTE_ONLY', NULL, true, true, true, NULL, NULL, NULL, 'Lona Náutica Aqualon', 'Azul Marinho / Branco / Preto', 0),

  ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002',
   'Capa de Proteção para Jet Ski', 'capa-protecao-jet-ski',
   'Capa de proteção para jet ski em lona náutica 600D com forro interno em tecido macio. Elástico nas bordas para fixação segura.',
   'Capa protetora em lona 600D para jet ski',
   'FIXED_PRICE', 489.90, true, false, false, 30, 320, 120, 'Lona Náutica 600D', 'Preto / Cinza', 1),

  ('d0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003',
   'Tenda Piramidal 5x5m', 'tenda-piramidal-5x5m',
   'Tenda piramidal 5x5 metros com estrutura em aço galvanizado e cobertura em lona vinílica blackout. Ideal para eventos corporativos, feiras e casamentos.',
   'Tenda piramidal 5x5m em lona blackout',
   'FIXED_PRICE', 3200.00, true, true, false, 8, 500, 350, 'Lona Vinílica Blackout + Aço Galvanizado', 'Branco', 0),

  ('d0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003',
   'Cobertura Tensionada sob Medida', 'cobertura-tensionada-sob-medida',
   'Cobertura tensionada com design arquitetônico personalizado. Membrana em PVDF ou PTFE com vida útil superior a 15 anos. Projeto estrutural incluso.',
   'Cobertura tensionada com projeto arquitetônico',
   'QUOTE_ONLY', NULL, true, false, true, NULL, NULL, NULL, 'Membrana PVDF / PTFE', 'Branco / Bege / Cinza', 1),

  ('d0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004',
   'Lona para Caminhão 8x5m', 'lona-caminhao-8x5m',
   'Lona para carroceria de caminhão em PVC 900g/m² com tratamento anti-chama. Ilhoses em latão a cada 50cm. Garantia de 2 anos.',
   'Lona PVC 900g para caminhão com anti-chama',
   'FIXED_PRICE', 1450.00, true, false, false, 25, 800, 500, 'PVC 900g/m²', 'Azul / Preto / Verde', 0),

  ('d0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004',
   'Cortina de Solda Industrial', 'cortina-solda-industrial',
   'Cortina de proteção para áreas de solda em PVC cristal laranja com proteção UV. Atende norma NR-12. Disponível em rolos ou sob medida.',
   'Cortina PVC para solda conforme NR-12',
   'FIXED_PRICE', 89.90, true, false, true, 100, 200, 200, 'PVC Cristal Laranja', 'Laranja Translúcido', 1)
ON CONFLICT DO NOTHING;

-- 6. Criar um refresh_token table (necessário para o auth da API)
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON public.refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
