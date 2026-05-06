import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { data: userData } = await admin
    .from('users')
    .select('role, artist_id')
    .eq('id', user!.id)
    .single<{ role: string; artist_id: string | null }>()

  const { data: stats } = await admin
    .from('tracks')
    .select('id', { count: 'exact', head: true })
    .eq('artist_id', userData?.artist_id ?? '')

  return (
    <div>
      <h1 className="font-head text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-text-secondary mb-8">
        Bem-vindo, <span className="text-accent">{user?.email}</span>
        <span className="ml-2 text-xs bg-accent-dim text-accent px-2 py-0.5 rounded-xl uppercase tracking-wider">
          {userData?.role}
        </span>
      </p>

      <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
        {[
          { label: 'Faixas',   href: '/dashboard/tracks',   icon: '🎵' },
          { label: 'Projetos', href: '/dashboard/projects',  icon: '🎬' },
          { label: 'Serviços', href: '/dashboard/services',  icon: '💼' },
          { label: 'Perfil',   href: '/dashboard/profile',   icon: '👤' },
        ].map(card => (
          <a key={card.href} href={card.href}
            className="bg-bg-card border border-[rgba(255,255,255,0.07)] rounded-lg p-6
              hover:border-[rgba(108,99,255,0.35)] hover:translate-y-[-2px] transition-all">
            <div className="text-3xl mb-3">{card.icon}</div>
            <h3 className="font-head text-lg font-bold">{card.label}</h3>
          </a>
        ))}
      </div>
    </div>
  )
}
