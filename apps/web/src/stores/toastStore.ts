import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  duration: number // ms
}

export type AddToastInput = Omit<Toast, 'id' | 'duration'> & { duration?: number }

export interface ToastStore {
  toasts: Toast[]
  addToast: (toast: AddToastInput) => void
  removeToast: (id: string) => void
}

const MAX_TOASTS = 5

const DEFAULT_DURATIONS: Record<Toast['type'], number> = {
  success: 3000,
  error: 5000,
  info: 4000,
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],

  addToast: (toast: AddToastInput) => {
    const id = crypto.randomUUID()
    const duration = toast.duration ?? DEFAULT_DURATIONS[toast.type]

    set((state) => {
      const newToast: Toast = { id, type: toast.type, message: toast.message, duration }
      const current = state.toasts

      // If at capacity, remove the oldest (first in array) before adding
      if (current.length >= MAX_TOASTS) {
        return { toasts: [...current.slice(1), newToast] }
      }

      return { toasts: [...current, newToast] }
    })
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
