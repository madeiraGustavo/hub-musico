/**
 * AudioService.ts
 *
 * Interface pública do player de áudio.
 * Componentes chamam métodos daqui — nunca acessam AudioEngine ou Store diretamente.
 *
 * Responsabilidades:
 * - Orquestra AudioEngine (reprodução) + usePlayerStore (estado)
 * - Gerencia fila, shuffle, repeat
 * - Inicializa listeners do AudioEngine uma única vez
 */

import { audioEngine }    from './AudioEngine'
import { usePlayerStore } from './usePlayerStore'
import type { Track }     from '@hub-musico/types'

let initialized = false

/**
 * Inicializa os listeners do AudioEngine → Store.
 * Chamar uma vez no root do app (AudioProvider).
 */
export function initAudioService(): void {
  if (initialized || !audioEngine) return
  initialized = true

  const store = usePlayerStore.getState

  audioEngine.on('play',    () => store()._setPlaying(true))
  audioEngine.on('pause',   () => store()._setPlaying(false))
  audioEngine.on('loading', () => store()._setLoading(true))
  audioEngine.on('canplay', () => store()._setLoading(false))

  audioEngine.on('timeupdate', (data) => {
    const d = data as { currentTime: number; duration: number }
    const pct = d.duration > 0 ? (d.currentTime / d.duration) * 100 : 0
    store()._setProgress(pct)
    store()._setCurrentTime(d.currentTime)
  })

  audioEngine.on('durationchange', (data) => {
    const d = data as { duration: number }
    store()._setDuration(d.duration)
  })

  audioEngine.on('error', () => {
    store()._setError('Erro ao reproduzir áudio')
    store()._setPlaying(false)
    store()._setLoading(false)
  })

  audioEngine.on('ended', () => {
    const { repeatMode } = store()
    if (repeatMode === 'one') {
      audioEngine?.seek(0)
      audioEngine?.play()
    } else {
      audioService.next()
    }
  })
}

// ── Métodos públicos ──────────────────────────────────────────────────────────

export const audioService = {

  /**
   * Reproduz uma faixa específica.
   * Se a faixa não tiver src, simula progresso.
   */
  async play(track: Track): Promise<void> {
    if (!audioEngine) return
    const store = usePlayerStore.getState()

    store._setError(null)
    store._setLoading(true)
    store._setCurrentTrack(track)
    store._setProgress(0)
    store._setCurrentTime(0)
    store._setDuration(0)

    if (track.src) {
      await audioEngine.load(track.src)
      await audioEngine.play()
    } else {
      // Faixa sem src — marca como playing sem áudio real
      store._setLoading(false)
      store._setPlaying(true)
    }
  },

  /** Pausa a reprodução atual */
  pause(): void {
    if (!audioEngine) return
    audioEngine.pause()
  },

  /** Alterna play/pause */
  async togglePlay(): Promise<void> {
    const { isPlaying, currentTrack } = usePlayerStore.getState()
    if (!currentTrack) return
    if (isPlaying) {
      this.pause()
    } else {
      if (currentTrack.src && audioEngine) {
        await audioEngine.play()
      } else {
        usePlayerStore.getState()._setPlaying(true)
      }
    }
  },

  /** Avança para a próxima faixa na fila */
  async next(): Promise<void> {
    const { queue, queueIndex, repeatMode, shuffle } = usePlayerStore.getState()
    if (!queue.length) return

    let nextIndex: number

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else if (queueIndex < queue.length - 1) {
      nextIndex = queueIndex + 1
    } else if (repeatMode === 'all') {
      nextIndex = 0
    } else {
      usePlayerStore.getState()._setPlaying(false)
      return
    }

    usePlayerStore.getState()._setQueueIndex(nextIndex)
    const nextTrack = queue[nextIndex]
    if (nextTrack) await this.play(nextTrack)
  },

  /** Volta para a faixa anterior */
  async prev(): Promise<void> {
    const { queue, queueIndex } = usePlayerStore.getState()
    if (!queue.length) return

    // Se passou mais de 3s, reinicia a faixa atual
    if (audioEngine && audioEngine.currentTime > 3) {
      audioEngine.seek(0)
      return
    }

    const prevIndex = queueIndex > 0 ? queueIndex - 1 : queue.length - 1
    usePlayerStore.getState()._setQueueIndex(prevIndex)
    const prevTrack = queue[prevIndex]
    if (prevTrack) await this.play(prevTrack)
  },

  /** Seek por porcentagem (0–1) */
  seek(pct: number): void {
    audioEngine?.seekByPercent(pct)
  },

  /** Define o volume (0–1) */
  setVolume(vol: number): void {
    audioEngine?.setVolume(vol)
    usePlayerStore.getState().setVolume(vol)
  },

  /** Muta/desmuta */
  setMuted(muted: boolean): void {
    audioEngine?.setMuted(muted)
    usePlayerStore.getState().setMuted(muted)
  },

  /**
   * Define a fila de reprodução e inicia a partir de um índice.
   * Usado pelos componentes de listagem.
   */
  async setQueueAndPlay(tracks: Track[], startIndex = 0): Promise<void> {
    usePlayerStore.getState().setQueue(tracks, startIndex)
    const track = tracks[startIndex]
    if (track) await this.play(track)
  },
}
