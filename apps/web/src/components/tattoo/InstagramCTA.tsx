import type { Artist } from '@hub-musico/types'
import { GradientText } from '@/lib/profile/GradientText'

interface Props {
  artist: Artist
}

export function InstagramCTA({ artist }: Props) {
  const instagramHandle = artist.social['instagram']

  return (
    <section className="py-20" style={{ background: 'var(--profile-bg-base)' }}>
      <div className="max-w-[700px] mx-auto px-6 text-center">
        <div className="rounded-lg p-10"
          style={{
            background: 'var(--profile-bg-card)',
            border:     '1px solid var(--profile-accent-border)',
            boxShadow:  '0 0 60px rgba(255,255,255,0.03)',
          }}>

          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl"
            style={{
              background: 'var(--profile-gradient)',
              boxShadow:  '0 8px 24px rgba(255,255,255,0.1)',
            }}>
            📸
          </div>

          <h2 className="font-head text-2xl font-bold mb-3" style={{ color: 'var(--profile-text)' }}>
            Acompanhe no{' '}
            <GradientText gradient="var(--profile-gradient)">Instagram</GradientText>
          </h2>

          <p className="mb-8 leading-[1.7]" style={{ color: 'var(--profile-text-secondary)' }}>
            Novos trabalhos, processo criativo e disponibilidade de agenda.
          </p>

          {instagramHandle ? (
            <a href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-[32px] font-semibold transition-all hover:translate-y-[-2px]"
              style={{
                background: 'var(--profile-gradient)',
                color:      '#000',
                boxShadow:  '0 4px 20px rgba(255,255,255,0.1)',
              }}>
              Seguir {instagramHandle}
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 px-8 py-4 rounded-[32px] font-semibold"
              style={{
                background: 'var(--profile-accent-dim)',
                border:     '1px solid var(--profile-accent-border)',
                color:      'var(--profile-accent)',
              }}>
              @instagram — em breve
            </div>
          )}

        </div>
      </div>
    </section>
  )
}
