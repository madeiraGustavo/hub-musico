import { Navbar }      from '@/components/Navbar'
import { Hero }        from '@/components/Hero'
import { Sobre }       from '@/components/Sobre'
import { Musicas }     from '@/components/Musicas'
import { Projetos }    from '@/components/Projetos'
import { Servicos }    from '@/components/Servicos'
import { Depoimentos } from '@/components/Depoimentos'
import { Contato }     from '@/components/Contato'
import { Footer }      from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Sobre />
        <Musicas />
        <Projetos />
        <Servicos />
        <Depoimentos />
        <Contato />
      </main>
      <Footer />
    </>
  )
}
