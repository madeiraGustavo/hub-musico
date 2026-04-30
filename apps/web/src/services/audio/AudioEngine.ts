/**
 * AudioEngine.ts
 *
 * Singleton que encapsula o HTMLAudioElement.
 * NUNCA importar diretamente nos componentes — usar AudioService.
 * Só existe no browser (guard typeof window).
 */

export type AudioEngineEvent =
  | 'play'
  | 'pause'
  | 'ended'
  | 'timeupdate'
  | 'durationchange'
  | 'error'
  | 'loading'
  | 'canplay'

export type AudioEngineListener = (data?: unknown) => void

class AudioEngine {
  private static instance: AudioEngine | null = null
  private audio: HTMLAudioElement | null = null
  private listeners: Map<AudioEngineEvent, Set<AudioEngineListener>> = new Map()

  private constructor() {
    if (typeof window === 'undefined') return
    this.audio = new Audio()
    this.audio.preload = 'metadata'
    this.audio.volume  = 0.8
    this.bindEvents()
  }

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine()
    }
    return AudioEngine.instance
  }

  private bindEvents() {
    if (!this.audio) return

    this.audio.addEventListener('play',           () => this.emit('play'))
    this.audio.addEventListener('pause',          () => this.emit('pause'))
    this.audio.addEventListener('ended',          () => this.emit('ended'))
    this.audio.addEventListener('canplay',        () => this.emit('canplay'))
    this.audio.addEventListener('timeupdate',     () => this.emit('timeupdate', {
      currentTime: this.audio?.currentTime ?? 0,
      duration:    this.audio?.duration    ?? 0,
    }))
    this.audio.addEventListener('durationchange', () => this.emit('durationchange', {
      duration: this.audio?.duration ?? 0,
    }))
    this.audio.addEventListener('error',          () => this.emit('error', this.audio?.error))
    this.audio.addEventListener('waiting',        () => this.emit('loading'))
  }

  // ── Playback ──────────────────────────────────────────────────────────────

  async load(src: string): Promise<void> {
    if (!this.audio) return
    this.audio.src = src
    this.audio.load()
  }

  async play(): Promise<void> {
    if (!this.audio) return
    try {
      await this.audio.play()
    } catch (err) {
      // Autoplay bloqueado pelo browser — não é erro crítico
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        console.warn('AudioEngine: autoplay bloqueado pelo browser')
      } else {
        this.emit('error', err)
      }
    }
  }

  pause(): void {
    this.audio?.pause()
  }

  seek(seconds: number): void {
    if (!this.audio) return
    this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || 0))
  }

  seekByPercent(pct: number): void {
    if (!this.audio?.duration) return
    this.seek(pct * this.audio.duration)
  }

  setVolume(vol: number): void {
    if (!this.audio) return
    this.audio.volume = Math.max(0, Math.min(1, vol))
  }

  setMuted(muted: boolean): void {
    if (!this.audio) return
    this.audio.muted = muted
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get currentTime(): number { return this.audio?.currentTime ?? 0 }
  get duration():    number { return this.audio?.duration    ?? 0 }
  get volume():      number { return this.audio?.volume      ?? 0.8 }
  get paused():      boolean { return this.audio?.paused     ?? true }
  get muted():       boolean { return this.audio?.muted      ?? false }

  // ── Events ────────────────────────────────────────────────────────────────

  on(event: AudioEngineEvent, listener: AudioEngineListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
    // Retorna função de cleanup
    return () => this.off(event, listener)
  }

  off(event: AudioEngineEvent, listener: AudioEngineListener): void {
    this.listeners.get(event)?.delete(listener)
  }

  private emit(event: AudioEngineEvent, data?: unknown): void {
    this.listeners.get(event)?.forEach(fn => fn(data))
  }
}

// Exporta o singleton — só instancia no browser
export const audioEngine = typeof window !== 'undefined'
  ? AudioEngine.getInstance()
  : null
