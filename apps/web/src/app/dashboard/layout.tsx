import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/dashboard/DashboardNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-bg-base flex">
      <DashboardNav />
      <main className="flex-1 ml-64 p-8 max-lg:ml-0 max-lg:pt-20">
        {children}
      </main>
    </div>
  )
}
