/**
 * Seed script — popula o banco com dados de exemplo para o marketplace de lonas.
 *
 * Uso: npx tsx prisma/seed.ts
 *
 * Cria:
 * - 1 usuário (lonas@artehub.com / senha123)
 * - 1 artista (Lonas Premium)
 * - 4 categorias
 * - 8 produtos (mix de FIXED_PRICE e QUOTE_ONLY)
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding marketplace data...')

  // 1. Criar usuário
  const userId = randomUUID()
  const artistId = randomUUID()
  const passwordHash = await bcrypt.hash('senha123', 12)

  await prisma.user.upsert({
    where: { siteId_email: { siteId: 'platform', email: 'lonas@artehub.com' } },
    update: {},
    create: {
      id: userId,
      siteId: 'platform',
      email: 'lonas@artehub.com',
      password: passwordHash,
      role: 'artist',
      artistId,
    },
  })

  console.log('✓ Usuário criado: lonas@artehub.com / senha123')

  // 2. Criar artista
  await prisma.artist.upsert({
    where: { id: artistId },
    update: {},
    create: {
      id: artistId,
      userId,
      name: 'Lonas Premium',
      slug: 'lonas-premium',
      profileType: 'musician', // usando tipo existente
      tagline: 'Toldos, capotas e coberturas sob medida',
      bio: ['Fabricação e instalação de lonas e coberturas desde 2010.', 'Atendemos residências, comércios e indústrias.'],
      location: 'São Paulo, SP',
      email: 'contato@lonaspremium.com.br',
      whatsapp: '11999999999',
      skills: ['Toldos', 'Capotas', 'Coberturas', 'Lonas Industriais'],
      tools: ['Lona Vinílica', 'Lona Blackout', 'Policarbonato', 'Acrílico'],
      isActive: true,
    },
  })

  console.log('✓ Artista criado: Lonas Premium')

  // 3. Criar categorias
  const categories = [
    { id: randomUUID(), name: 'Toldos', slug: 'toldos', icon: '☀️', sortOrder: 0 },
    { id: randomUUID(), name: 'Capotas', slug: 'capotas', icon: '🚗', sortOrder: 1 },
    { id: randomUUID(), name: 'Coberturas', slug: 'coberturas', icon: '🏠', sortOrder: 2 },
    { id: randomUUID(), name: 'Lonas Industriais', slug: 'lonas-industriais', icon: '🏭', sortOrder: 3 },
  ]

  for (const cat of categories) {
    await prisma.marketplaceCategory.upsert({
      where: { marketplace_category_artist_slug: { artistId, slug: cat.slug } },
      update: {},
      create: { ...cat, artistId },
    })
  }

  console.log('✓ 4 categorias criadas')

  // 4. Criar produtos
  const products = [
    {
      title: 'Toldo Retrátil 3x2m',
      slug: 'toldo-retratil-3x2m',
      description: 'Toldo retrátil com braço articulado, ideal para varandas e áreas de lazer. Lona em poliéster com proteção UV. Estrutura em alumínio anodizado com pintura eletrostática. Acionamento manual com manivela.',
      shortDescription: 'Toldo retrátil com braço articulado para varandas',
      type: 'FIXED_PRICE' as const,
      basePrice: 1890.00,
      active: true,
      featured: true,
      customizable: false,
      stock: 15,
      widthCm: 300,
      heightCm: 200,
      material: 'Poliéster com proteção UV',
      color: 'Cinza Grafite',
      categoryId: categories[0].id,
      sortOrder: 0,
    },
    {
      title: 'Toldo Fixo Policarbonato 4x3m',
      slug: 'toldo-fixo-policarbonato-4x3m',
      description: 'Toldo fixo com cobertura em policarbonato alveolar 6mm. Estrutura metálica com tratamento anticorrosivo. Permite passagem de luz natural com proteção contra chuva e sol.',
      shortDescription: 'Cobertura fixa em policarbonato para garagens e varandas',
      type: 'FIXED_PRICE' as const,
      basePrice: 2450.00,
      active: true,
      featured: true,
      customizable: false,
      stock: 8,
      widthCm: 400,
      heightCm: 300,
      material: 'Policarbonato Alveolar 6mm',
      color: 'Fumê',
      categoryId: categories[0].id,
      sortOrder: 1,
    },
    {
      title: 'Capota Náutica para Lancha',
      slug: 'capota-nautica-lancha',
      description: 'Capota náutica sob medida para lanchas e barcos. Confeccionada em lona Acrílica Sunbrella com costuras reforçadas e zíperes marinhos YKK. Resistente a maresia, mofo e raios UV.',
      shortDescription: 'Capota sob medida para embarcações com lona Sunbrella',
      type: 'QUOTE_ONLY' as const,
      basePrice: null,
      active: true,
      featured: true,
      customizable: true,
      stock: null,
      widthCm: null,
      heightCm: null,
      material: 'Lona Acrílica Sunbrella',
      color: 'Navy Blue',
      categoryId: categories[1].id,
      sortOrder: 0,
    },
    {
      title: 'Capota para Caminhonete',
      slug: 'capota-caminhonete',
      description: 'Capota marítima para caçamba de caminhonete. Lona vinílica de alta resistência com estrutura tubular em aço galvanizado. Abertura traseira com velcro e zíper.',
      shortDescription: 'Capota marítima para caçamba de caminhonete',
      type: 'FIXED_PRICE' as const,
      basePrice: 980.00,
      active: true,
      featured: false,
      customizable: false,
      stock: 20,
      widthCm: 150,
      heightCm: 120,
      material: 'Lona Vinílica 18oz',
      color: 'Preto',
      categoryId: categories[1].id,
      sortOrder: 1,
    },
    {
      title: 'Cobertura para Estacionamento',
      slug: 'cobertura-estacionamento',
      description: 'Cobertura tensionada para estacionamentos comerciais e residenciais. Projeto personalizado com membrana em PTFE ou lona vinílica. Estrutura metálica com cálculo estrutural incluso.',
      shortDescription: 'Cobertura tensionada para estacionamentos',
      type: 'QUOTE_ONLY' as const,
      basePrice: null,
      active: true,
      featured: true,
      customizable: true,
      stock: null,
      widthCm: null,
      heightCm: null,
      material: 'Membrana PTFE / Lona Vinílica',
      color: 'Branco Translúcido',
      categoryId: categories[2].id,
      sortOrder: 0,
    },
    {
      title: 'Pergolado com Cobertura Retrátil',
      slug: 'pergolado-cobertura-retratil',
      description: 'Pergolado em madeira de lei ou alumínio com cobertura retrátil em lona blackout. Sistema de trilhos permite abrir e fechar a cobertura conforme necessidade. Ideal para áreas gourmet.',
      shortDescription: 'Pergolado com cobertura retrátil para áreas gourmet',
      type: 'FIXED_PRICE' as const,
      basePrice: 4500.00,
      active: true,
      featured: true,
      customizable: true,
      stock: 5,
      widthCm: 400,
      heightCm: 300,
      material: 'Lona Blackout + Alumínio',
      color: 'Areia',
      categoryId: categories[2].id,
      sortOrder: 1,
    },
    {
      title: 'Lona para Caminhão Graneleiro',
      slug: 'lona-caminhao-graneleiro',
      description: 'Lona para cobertura de cargas em caminhões graneleiros. Material em PVC 900g/m² com tratamento anti-chama. Ilhoses em latão a cada 30cm. Sob medida conforme dimensões da carroceria.',
      shortDescription: 'Lona PVC para caminhões graneleiros sob medida',
      type: 'QUOTE_ONLY' as const,
      basePrice: null,
      active: true,
      featured: false,
      customizable: true,
      stock: null,
      widthCm: null,
      heightCm: null,
      material: 'PVC 900g/m² Anti-chama',
      color: 'Azul Royal',
      categoryId: categories[3].id,
      sortOrder: 0,
    },
    {
      title: 'Cortina de Lona para Galpão',
      slug: 'cortina-lona-galpao',
      description: 'Cortina divisória em lona vinílica para galpões industriais. Permite isolamento térmico e acústico entre setores. Sistema de trilho superior com rolamentos para fácil manuseio.',
      shortDescription: 'Cortina divisória industrial em lona vinílica',
      type: 'FIXED_PRICE' as const,
      basePrice: 320.00,
      active: true,
      featured: false,
      customizable: true,
      stock: 50,
      widthCm: 100,
      heightCm: 300,
      material: 'Lona Vinílica 22oz',
      color: 'Amarelo Segurança',
      categoryId: categories[3].id,
      sortOrder: 1,
    },
  ]

  for (const product of products) {
    const existing = await prisma.marketplaceProduct.findFirst({
      where: { artistId, slug: product.slug },
    })
    if (!existing) {
      await prisma.marketplaceProduct.create({
        data: { ...product, artistId },
      })
    }
  }

  console.log('✓ 8 produtos criados')
  console.log('')
  console.log('🎉 Seed completo!')
  console.log('')
  console.log('Credenciais de acesso:')
  console.log('  Email: lonas@artehub.com')
  console.log('  Senha: senha123')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
