'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from '@hub-art/types'

const DURATION_SIM = 30

function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

export interface PlayerState {
  currentId: string
  isPlaying: boolean
  progress: number
  currentTime: string
  totalTime: string
  title: string
  genre: string
}

export interface PlayerControls {
  play: (id: string) => void
  togglePlay: () => void
  next: (visibleIds: string[]) => void
  prev: (visibleIds: string[]) => void
  seek: (pct: number) => void
  setVolume: (vol: number) => void
}

export function usePlayer(tracks: Track[]): [PlayerState, PlayerControls] {
  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef(0)

  const [state, setState] = useState<PlayerState>({
    currentId:   '',
    isPlaying:   false,
    progress:    0,
    currentTime: '0:00',
    totalTime:   '0:00',
    title:       '—',
    genre:       '—',
  })

  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.volume = 0.8
    audioRef.current.preload = 'none'
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startRealProgress = useCallback(() => {
    stopTimer()
    timerRef.current = setInterval(() => {
      const audio = audioRef.current
      if (!audio || audio.paused) return
      const dur = audio.duration || 0
      const cur = audio.currentTime || 0
      if (dur > 0) {
        setState(prev => ({
          ...prev,
          progress:    (cur / dur) * 100,
          currentTime: formatTime(cur),
          totalTime:   formatTime(dur),
        }))
      }
    }, 300)
  }, [stopTimer])

  const startSimProgress = useCallback((onEnd: () => void) => {
    stopTimer()
    timerRef.current = setInterval(() => {
      elapsedRef.current += 0.5
      if (elapsedRef.current >= DURATION_SIM) {
        elapsedRef.current = 0
        onEnd()
        return
      }
      setState(prev => ({
        ...prev,
        progress:    (elapsedRef.current / DURATION_SIM) * 100,
        currentTime: formatTime(elapsedRef.current),
        totalTime:   formatTime(DURATION_SIM),
      }))
    }, 500)
  }, [stopTimer])

  const play = useCallback((id: string) => {
    const track = tracks.find(t => t.id === id)
    if (!track) return

    audioRef.current?.pause()
    stopTimer()
    elapsedRef.current = 0

    setState(prev => ({
      ...prev,
      currentId:   id,
      isPlaying:   true,
      progress:    0,
      currentTime: '0:00',
      totalTime:   '0:00',
      title:       track.title,
      genre:       track.genreLabel,
    }))

    if (track.src && audioRef.current) {
      const audio = audioRef.current
      audio.src = track.src
      audio.load()
      // Aguarda o áudio estar pronto antes de dar play
      const onCanPlay = () => {
        audio.play().catch(err => console.error('usePlayer: play() falhou', err))
        audio.removeEventListener('canplay', onCanPlay)
      }
      audio.addEventListener('canplay', onCanPlay)
      startRealProgress()
    } else {
      startSimProgress(() => {})
    }
  }, [tracks, stopTimer, startRealProgress, startSimProgress])

  const togglePlay = useCallback(() => {
    setState(prev => {
      if (prev.currentId === '') return prev
      const next = !prev.isPlaying
      if (next) {
        const track = tracks.find(t => t.id === prev.currentId)
        if (track?.src && audioRef.current) {
          audioRef.current.play().catch(() => {})
          startRealProgress()
        } else {
          startSimProgress(() => {})
        }
      } else {
        audioRef.current?.pause()
        stopTimer()
      }
      return { ...prev, isPlaying: next }
    })
  }, [tracks, startRealProgress, startSimProgress, stopTimer])

  const next = useCallback((visibleIds: string[]) => {
    setState(prev => {
      if (!visibleIds.length) return prev
      const idx   = visibleIds.indexOf(prev.currentId)
      const nextId = visibleIds[(idx + 1) % visibleIds.length] ?? visibleIds[0]
      if (nextId !== undefined) play(nextId)
      return prev
    })
  }, [play])

  const prev = useCallback((visibleIds: string[]) => {
    setState(prev => {
      if (!visibleIds.length) return prev
      const idx   = visibleIds.indexOf(prev.currentId)
      const prevId = visibleIds[(idx - 1 + visibleIds.length) % visibleIds.length] ?? visibleIds[0]
      if (prevId !== undefined) play(prevId)
      return prev
    })
  }, [play])

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current
    if (audio?.duration) {
      audio.currentTime = pct * audio.duration
    } else {
      elapsedRef.current = pct * DURATION_SIM
      setState(prev => ({
        ...prev,
        progress:    pct * 100,
        currentTime: formatTime(elapsedRef.current),
      }))
    }
  }, [])

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) audioRef.current.volume = vol
  }, [])

  return [state, { play, togglePlay, next, prev, seek, setVolume }]
}
