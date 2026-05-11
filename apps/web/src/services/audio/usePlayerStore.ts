/**
 * usePlayerStore.ts
 *
 * Estado global do player via Zustand.
 * Componentes leem daqui — nunca acessam AudioEngine diretamente.
 *
 * Persistência seletiva: salva volume, currentId e queue no localStorage.
 * NÃO persiste src (URLs assinadas expiram).
 */

'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Track } from '@hub-art/types'

export type RepeatMode = 'none' | 'one' | 'all'

export interface PlayerStore {
  // Estado de reprodução
  currentTrack:  Track | null
  isPlaying:     boolean
  isLoading:     boolean
  progress:      number        // 0–100
  currentTime:   number        // segundos
  duration:      number        // segundos
  volume:        number        // 0–1
  muted:         boolean
  repeatMode:    RepeatMode
  shuffle:       boolean
  error:         string | null

  // Fila
  queue:         Track[]
  queueIndex:    number

  // Actions — chamadas pelo AudioService, não pelos componentes
  _setPlaying:     (v: boolean)       => void
  _setLoading:     (v: boolean)       => void
  _setProgress:    (p: number)        => void
  _setCurrentTime: (t: number)        => void
  _setDuration:    (d: number)        => void
  _setError:       (e: string | null) => void
  _setCurrentTrack:(t: Track | null)  => void
  _setQueueIndex:  (i: number)        => void

  // Actions públicas — usadas pelos componentes
  setVolume:    (v: number)     => void
  setMuted:     (v: boolean)    => void
  setRepeat:    (m: RepeatMode) => void
  setShuffle:   (v: boolean)    => void
  setQueue:     (tracks: Track[], startIndex?: number) => void
  clearQueue:   ()              => void
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      currentTrack:  null,
      isPlaying:     false,
      isLoading:     false,
      progress:      0,
      currentTime:   0,
      duration:      0,
      volume:        0.8,
      muted:         false,
      repeatMode:    'none',
      shuffle:       false,
      error:         null,
      queue:         [],
      queueIndex:    -1,

      _setPlaying:      (isPlaying)     => set({ isPlaying }),
      _setLoading:      (isLoading)     => set({ isLoading }),
      _setProgress:     (progress)      => set({ progress }),
      _setCurrentTime:  (currentTime)   => set({ currentTime }),
      _setDuration:     (duration)      => set({ duration }),
      _setError:        (error)         => set({ error }),
      _setCurrentTrack: (currentTrack)  => set({ currentTrack }),
      _setQueueIndex:   (queueIndex)    => set({ queueIndex }),

      setVolume:  (volume)  => set({ volume }),
      setMuted:   (muted)   => set({ muted }),
      setRepeat:  (repeatMode) => set({ repeatMode }),
      setShuffle: (shuffle) => set({ shuffle }),

      setQueue: (tracks, startIndex = 0) =>
        set({ queue: tracks, queueIndex: startIndex }),

      clearQueue: () =>
        set({ queue: [], queueIndex: -1, currentTrack: null, isPlaying: false }),
    }),
    {
      name: 'player-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem:    () => null,
          setItem:    () => {},
          removeItem: () => {},
        }
      ),
      // Persiste apenas preferências — não estado de reprodução
      partialize: (state) => ({
        volume:     state.volume,
        muted:      state.muted,
        repeatMode: state.repeatMode,
        shuffle:    state.shuffle,
        queue:      state.queue.map(t => ({ ...t, src: null })), // remove src
        queueIndex: state.queueIndex,
      }),
    },
  ),
)
