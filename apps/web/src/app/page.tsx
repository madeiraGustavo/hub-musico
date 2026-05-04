import { MusicianLayout } from '@/components/musician/MusicianLayout'
import { getArtist }      from '@/services/artistService'
import { getTracks }      from '@/services/trackService'
import { getProjects }    from '@/services/projectService'

export default async function Home() {
  const [artist, tracks, projects] = await Promise.all([
    getArtist(),
    getTracks(),
    getProjects(),
  ])

  return (
    <main>
      <MusicianLayout artist={artist} tracks={tracks} projects={projects} />
    </main>
  )
}
