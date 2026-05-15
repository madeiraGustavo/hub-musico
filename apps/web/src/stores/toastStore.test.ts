import { describe, it, expect, beforeEach } from 'vitest'
import { useToastStore } from './toastStore'

function resetStore() {
  useToastStore.setState({ toasts: [] })
}

describe('toastStore', () => {
  beforeEach(resetStore)

  describe('addToast', () => {
    it('adds a toast with a generated id', () => {
      useToastStore.getState().addToast({
        type: 'success',
        message: 'Item added',
        duration: 3000,
      })

      const toasts = useToastStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0]!.type).toBe('success')
      expect(toasts[0]!.message).toBe('Item added')
      expect(toasts[0]!.duration).toBe(3000)
      expect(toasts[0]!.id).toBeDefined()
      expect(typeof toasts[0]!.id).toBe('string')
      expect(toasts[0]!.id.length).toBeGreaterThan(0)
    })

    it('generates unique ids for each toast', () => {
      useToastStore.getState().addToast({ type: 'success', message: 'A', duration: 3000 })
      useToastStore.getState().addToast({ type: 'error', message: 'B', duration: 5000 })

      const toasts = useToastStore.getState().toasts
      expect(toasts[0]!.id).not.toBe(toasts[1]!.id)
    })

    it('preserves insertion order', () => {
      useToastStore.getState().addToast({ type: 'success', message: 'First', duration: 3000 })
      useToastStore.getState().addToast({ type: 'error', message: 'Second', duration: 5000 })
      useToastStore.getState().addToast({ type: 'info', message: 'Third', duration: 3000 })

      const toasts = useToastStore.getState().toasts
      expect(toasts[0]!.message).toBe('First')
      expect(toasts[1]!.message).toBe('Second')
      expect(toasts[2]!.message).toBe('Third')
    })

    it('caps at 5 toasts, removing oldest on overflow', () => {
      for (let i = 1; i <= 6; i++) {
        useToastStore.getState().addToast({
          type: 'info',
          message: `Toast ${i}`,
          duration: 3000,
        })
      }

      const toasts = useToastStore.getState().toasts
      expect(toasts).toHaveLength(5)
      expect(toasts[0]!.message).toBe('Toast 2')
      expect(toasts[4]!.message).toBe('Toast 6')
    })

    it('removes oldest when already at capacity', () => {
      for (let i = 1; i <= 5; i++) {
        useToastStore.getState().addToast({
          type: 'success',
          message: `Toast ${i}`,
          duration: 3000,
        })
      }
      expect(useToastStore.getState().toasts).toHaveLength(5)

      useToastStore.getState().addToast({
        type: 'error',
        message: 'Overflow',
        duration: 5000,
      })

      const toasts = useToastStore.getState().toasts
      expect(toasts).toHaveLength(5)
      expect(toasts[0]!.message).toBe('Toast 2')
      expect(toasts[4]!.message).toBe('Overflow')
    })

    it('applies default duration of 3000ms for success type', () => {
      useToastStore.getState().addToast({ type: 'success', message: 'Done' })

      const toasts = useToastStore.getState().toasts
      expect(toasts[0]!.duration).toBe(3000)
    })

    it('applies default duration of 5000ms for error type', () => {
      useToastStore.getState().addToast({ type: 'error', message: 'Failed' })

      const toasts = useToastStore.getState().toasts
      expect(toasts[0]!.duration).toBe(5000)
    })

    it('applies default duration of 4000ms for info type', () => {
      useToastStore.getState().addToast({ type: 'info', message: 'Note' })

      const toasts = useToastStore.getState().toasts
      expect(toasts[0]!.duration).toBe(4000)
    })

    it('uses explicit duration when provided', () => {
      useToastStore.getState().addToast({ type: 'success', message: 'Custom', duration: 7000 })

      const toasts = useToastStore.getState().toasts
      expect(toasts[0]!.duration).toBe(7000)
    })
  })

  describe('removeToast', () => {
    it('removes a toast by id', () => {
      useToastStore.getState().addToast({ type: 'success', message: 'Keep', duration: 3000 })
      useToastStore.getState().addToast({ type: 'error', message: 'Remove', duration: 5000 })

      const toasts = useToastStore.getState().toasts
      const idToRemove = toasts[1]!.id

      useToastStore.getState().removeToast(idToRemove)

      const remaining = useToastStore.getState().toasts
      expect(remaining).toHaveLength(1)
      expect(remaining[0]!.message).toBe('Keep')
    })

    it('does nothing when id does not exist', () => {
      useToastStore.getState().addToast({ type: 'info', message: 'Stays', duration: 3000 })

      useToastStore.getState().removeToast('non-existent-id')

      expect(useToastStore.getState().toasts).toHaveLength(1)
    })
  })
})
