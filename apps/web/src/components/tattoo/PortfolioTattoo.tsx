import type { Project } from '@hub-musico/types'
import { GradientText } from '@/lib/profile/GradientText'

interface Props {
  projects: Project[]
}

function PortfolioCard({ project }: { project: Project }) {
  const bgStyle: React.CSSProperties = project.thumbnailUrl
    ? {
        backgroundImage:    `url('${project.thumbnailUrl}')`,
        backgroundSize:     project.backgroundSize ?? 'cover',
        backgroundPosition: project.backgroundPosition ?? 'center',
        backgroundRepeat:   'no-repeat',
      }
    : { background: 'var(--profile-bg-card)' }

  return (
    <a href={project.href} target="_blank" rel="noopener noreferrer"
      className="group relative aspect-square rounded-lg overflow-hidden block
        hover:translate-y-[-4px] transition-all"
      style={{ ...bgStyle, border: '1px solid var(--profile-accent-border)' }}>

      <div className="absolute inset-0 transition-all"
        style={{ background: 'rgba(0,0,0,0.3)' }} />

      <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 60%)' }}>
        <h3 className="font-head text-base font-bold mb-1" style={{ color: 'var(--profile-text)' }}>
          {project.title}
        </h3>
        <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--profile-text-secondary)' }}>
          {project.description}
        </p>
        <div className="flex flex-wrap gap-1">
          {project.tags.map(tag => (
            <span key={tag}
              className="px-2 py-0.5 rounded-xl text-xs"
              style={{ background: 'var(--profile-accent-dim)', color: 'var(--profile-accent)' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {!project.thumbnailUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl opacity-20" style={{ color: 'var(--profile-accent)' }}>✦</span>
        </div>
      )}
    </a>
  )
}

export function PortfolioTattoo({ projects }: Props) {
  return (
    <section id="portfolio" className="py-[120px]" style={{ background: 'var(--profile-bg-base)' }}>
      <div className="max-w-[1200px] mx-auto px-6">

        <div className="text-center mb-14">
          <p className="inline-block text-xs font-semibold tracking-[0.12em] uppercase mb-3"
            style={{ color: 'var(--profile-accent)' }}>
            Galeria
          </p>
          <h2 className="font-head text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.15]"
            style={{ color: 'var(--profile-text)' }}>
            Trabalhos em{' '}
            <GradientText gradient="var(--profile-gradient)">destaque</GradientText>
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
          {projects.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--profile-bg-card)', border: '1px solid var(--profile-accent-border)' }}>
                  <span className="text-3xl opacity-20" style={{ color: 'var(--profile-accent)' }}>✦</span>
                </div>
              ))
            : projects.map(project => (
                <PortfolioCard key={project.id} project={project} />
              ))
          }
        </div>

      </div>
    </section>
  )
}
