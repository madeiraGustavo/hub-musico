/**
 * Seed script para popular o marketplace com dados de demonstração.
 * 
 * Uso: npx tsx prisma/seed-marketplace.ts
 * 
 * Cria:
 * - 1 usuário + artista (Lonas São Paulo)
 * - 4 categorias (Toldos, Capotas, Coberturas, Lonas Industriais)
 * - 8 produtos (2 por categoria, mix de FIXED_PRICE e QUOTE_ONLY)
 */

import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import { hashSync } from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding marketplace data...')

  // 1. Criar usuário e artista
  const userId = randomUUID()
  const artistId = randomUUID()

  const existingUser = await prisma.user.findUnique({ where: { email: 'demo@lonassaopaulo.com.br' } })
  if (existingUser) {
    console.log('⚠️  Usuário demo já existe. Pulando seed.')
    return
  }

  await prisma.user.create({
    data: {
      id: userId,
      email: 'demo@lonassaopaulo.com.br',
      password: hashSync('demo123456', 10),
      role: 'artist',
      artistId,
    },
  })

  await prisma.artist.create({
    data: {
      id: artistId,
      userId,
      name: 'Lonas São Paulo',
      slug: 'lonas-sao-paulo',
      profileType: 'musician', // usando o tipo existente
      tagline: 'Toldos, capotas e coberturas sob medida desde 2005',
      bio: ['Fabricação própria de toldos, capotas náuticas, coberturas para eventos e lonas industriais.', 'Atendemos todo o estado de São Paulo com entrega e instalação.'],
      location: 'São Paulo, SP',
      email: 'contato@lonassaopaulo.com.br',
      whatsapp: '11999887766',
      skills: ['Toldos Retráteis', 'Capotas Náuticas', 'Coberturas', 'Lonas Industriais'],
      tools: ['Lona Vinílica', 'Lona Acrílica', 'Policarbonato', 'Alumínio'],
      isActive: true,
    },
  })

  console.log('✅ Usuário e artista criados')
  console.log('   Email: demo@lonassaopaulo.com.br')
  console.log('   Senha: demo123456')

  // 2. Criar categorias
  const categories = [
    { id: randomUUID(), name: 'Toldos', slug: 'toldos', icon: '☀️', sortOrder: 0 },
    { id: randomUUID(), name: 'Capotas Náuticas', slug: 'capotas-nauticas', icon: '⛵', sortOrder: 1 },
    { id: randomUUID(), name: 'Coberturas para Eventos', slug: 'coberturas-para-eventos', icon: '🎪', sortOrder: 2 },
    { id: randomUUID(), name: 'Lonas Industriais', slug: 'lonas-industriais', icon: '🏭', sortOrder: 3 },
  ]

  for (const cat of categories) {
    await prisma.marketplaceCategory.create({
      data: { ...cat, artistId },
    })
  }

  console.log('✅ 4 categorias criadas')

  // 3. Criar produtos
  const products = [
    // Toldos
    {
      categoryId: categories[0].id,
      title: 'Toldo Retrátil Articulado',
      slug: 'toldo-retratil-articulado',
      description: 'Toldo retrátil com braços articulados em alumínio, ideal para varandas, sacadas e fachadas comerciais. Lona acrílica importada com proteção UV e impermeabilização. Acionamento manual com manivela ou motorizado.',
      shortDescription: 'Toldo articulado em alumínio com lona acrílica UV',
      type: 'QUOTE_ONLY' as const,
      basePrice: null,
      active: true,
      featured: true,
      customizable: true,
      stock: null,
      widthCm: 300,
      heightCm: 250,
      material: 'Lona Acrílica + Alumínio',
      color: 'Diversas cores disponíveis',
      sortOrder: 0,
    },
    {
      categoryId: categories[0].id,
      title: 'Toldo Fixo Policarbonato',
      slug: 'toldo-fixo-policarbonato',
      description: 'Toldo fixo com estrutura em alumínio e cobertura em policarbonato alveolar. Excelente para garagens, entradas e áreas de serviço. Alta resistência a impactos e proteção contra raios UV.',
      shortDescription: 'Toldo fixo com policarbonato alveolar e alumínio',
      type: 'FIXED_PRICE' as const,
      basePrice: 1890.00,
      active: true,
      featured: true,
      customizable: false,
      stock: 15,
      widthCm: 200,
      heightCm: 100,
      material: 'Policarbonato Alveolar + Alumínio',
      color: 'Bronze / Cristal',
      sortOrder: 1,
    },
    // Capotas Náuticas
    {
      categoryId: categories[1].id,
      title: 'Capota para Lancha até 22 pés',
      slug: 'capota-lancha-22-pes',
      description: 'Capota náutica sob medida para lanchas de até 22 pés. Confeccionada em lona náutica Aqualon com tratamento anti-mofo e proteção UV. Estrutura em aço inox 316L. Inclui zíperes YKK e acabamento premium.',
      shortDescription: 'Capota náutica em Aqualon para lanchas até 22 pés',
      type: 'QUOTE_ONLY' as const,
      basePrice: null,
      active: true,
      featured: true,
      customizable: true,
      stock: null,
      widthCm: null,
      heightCm: null,
      material: 'Lona Náutica Aqualon',
      color: 'Azul Marinho / Branco / Preto',
      sortOrder: 0,
    },
    {
      categoryId: categories[1].id,
      title: 'Capa de Proteção para Jet Ski',
      slug: 'capa-protecao-jet-ski',
      description: 'Capa de proteção para jet ski em lona náutica 600D com forro interno em tecido macio. Elástico nas bordas para fixação segura. Protege contra sol, chuva e poeira.',
      shortDescription: 'Capa protetora em lona 600D para jet ski',
      type: 'FIXED_PRICE' as const,
      basePrice: 489.90,
      active: true,
      featured: false,
      customizable: false,
      stock: 30,
      widthCm: 320,
      heightCm: 120,
      material: 'Lona Náutica 600D',
      color: 'Preto / Cinza',
      sortOrder: 1,
    },
    // Coberturas para Eventos
    {
      categoryId: categories[2].id,
      title: 'Tenda Piramidal 5x5m',
      slug: 'tenda-piramidal-5x5m',
      description: 'Tenda piramidal 5x5 metros com estrutura em aço galvanizado e cobertura em lona vinílica blackout. Ideal para eventos corporativos, feiras e casamentos. Inclui calhas laterais e sistema de escoamento.',
      shortDescription: 'Tenda piramidal 5x5m em lona blackout',
      type: 'FIXED_PRICE' as const,
      basePrice: 3200.00,
      active: true,
      featured: true,
      customizable: false,
      stock: 8,
      widthCm: 500,
      heightCm: 350,
      material: 'Lona Vinílica Blackout + Aço Galvanizado',
      color: 'Branco',
      sortOrder: 0,
    },
    {
      categoryId: categories[2].id,
      title: 'Cobertura Tensionada sob Medida',
      slug: 'cobertura-tensionada-sob-medida',
      description: 'Cobertura tensionada com design arquitetônico personalizado. Membrana em PVDF ou PTFE com vida útil superior a 15 anos. Projeto estrutural incluso. Ideal para estacionamentos, praças e áreas de lazer.',
      shortDescription: 'Cobertura tensionada com projeto arquitetônico',
      type: 'QUOTE_ONLY' as const,
      basePrice: null,
      active: true,
      featured: false,
      customizable: true,
      stock: null,
      widthCm: null,
      heightCm: null,
      material: 'Membrana PVDF / PTFE',
      color: 'Branco / Bege / Cinza',
      sortOrder: 1,
    },
    // Lonas Industriais
    {
      categoryId: categories[3].id,
      title: 'Lona para Caminhão 8x5m',
      slug: 'lona-caminhao-8x5m',
      description: 'Lona para carroceria de caminhão em PVC 900g/m² com tratamento anti-chama. Ilhoses em latão a cada 50cm. Alta resistência a rasgos e intempéries. Garantia de 2 anos.',
      shortDescription: 'Lona PVC 900g para caminhão com anti-chama',
      type: 'FIXED_PRICE' as const,
      basePrice: 1450.00,
      active: true,
      featured: false,
      customizable: false,
      stock: 25,
      widthCm: 800,
      heightCm: 500,
      material: 'PVC 900g/m²',
      color: 'Azul / Preto / Verde',
      sortOrder: 0,
    },
    {
      categoryId: categories[3].id,
      title: 'Cortina de Solda Industrial',
      slug: 'cortina-solda-industrial',
      description: 'Cortina de proteção para áreas de solda em PVC cristal laranja com proteção UV. Atende norma NR-12. Disponível em rolos ou sob medida com trilho e ganchos.',
      shortDescription: 'Cortina PVC para solda conforme NR-12',
      type: 'FIXED_PRICE' as const,
      basePrice: 89.90,
      active: true,
      featured: false,
      customizable: true,
      stock: 100,
      widthCm: 200,
      heightCm: 200,
      material: 'PVC Cristal Laranja',
      color: 'Laranja Translúcido',
      sortOrder: 1,
    },
  ]

  for (const product of products) {
    await prisma.marketplaceProduct.create({
      data: {
        ...product,
        artistId,
        basePrice: product.basePrice ?? undefined,
        widthCm: product.widthCm ?? undefined,
        heightCm: product.heightCm ?? undefined,
      },
    })
  }

  console.log('✅ 8 produtos criados')
  console.log('')
  console.log('🎉 Seed completo!')
  console.log('')
  console.log('Acesse:')
  console.log('  - Marketplace: /marketplace')
  console.log('  - Dashboard:   /dashboard/marketplace')
  console.log('  - Login:       demo@lonassaopaulo.com.br / demo123456')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
