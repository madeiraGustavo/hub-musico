import { notFound }         from 'next/navigation'
import { MusicianLayout }   from '@/components/musician/MusicianLayout'
import { TattooLayout }     from '@/components/tattoo/TattooLayout'
import { SchedulingSection } from '@/components/scheduling/SchedulingSection'
import { getArtistBySlug }  from '@/services/artistService'
import { getTracks }        from '@/services/trackService'
import { getProjects }      from '@/services/projectService'
import type { Metadata }    from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const artist = await getArtistBySlug(params.slug)
  if (!artist) return { title: 'Perfil não encontrado' }
  return {
    title:       `${artist.name} — ${artist.tagline}`,
    description: artist.bio[0] ?? artist.tagline,
  }
}

export default async function ProfilePage({ params }: Props) {
  const artist = await getArtistBySlug(params.slug)
  if (!artist) notFound()

  const [tracks, projects] = await Promise.all([
    getTracks(),
    getProjects(),
  ])

  return (
    <main>
      {artist.profileType === 'musician' && (
        <MusicianLayout artist={artist} tracks={tracks} projects={projects} />
      )}
      {artist.profileType === 'tattoo' && (
        <TattooLayout artist={artist} tracks={tracks} projects={projects} />
      )}
      <SchedulingSection artistId={artist.id} />
    </main>
  )
}
