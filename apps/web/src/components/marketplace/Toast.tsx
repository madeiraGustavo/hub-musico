'use client'

import { useEffect, useState } from 'react'
import { useToastStore, type Toast } from '@/stores/toastStore'

/**
 * ToastContainer — renders all active toasts from the toast store.
 * Positioned fixed top-right, stacks vertically with 8px gap.
 * Uses aria-live="polite" for screen reader announcements.
 */
export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

/**
 * Individual toast notification with auto-dismiss and animations.
 * Slides in from the right, fades out on dismiss.
 * Respects prefers-reduced-motion via the .marketplace CSS layer.
 */
export function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((state) => state.removeToast)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
    }, toast.duration)

    return () => clearTimeout(timer)
  }, [toast.duration])

  useEffect(() => {
    if (!isExiting) return

    const exitTimer = setTimeout(() => {
      removeToast(toast.id)
    }, 200) // matches fade-out duration

    return () => clearTimeout(exitTimer)
  }, [isExiting, removeToast, toast.id])

  const handleDismiss = () => {
    setIsExiting(true)
  }

  const borderColorClass =
    toast.type === 'success'
      ? 'border-l-green-500'
      : toast.type === 'error'
        ? 'border-l-red-500'
        : 'border-l-blue-500'

  const iconColor =
    toast.type === 'success'
      ? 'text-green-600'
      : toast.type === 'error'
        ? 'text-red-600'
        : 'text-blue-600'

  return (
    <div
      role="alert"
      className={`
        pointer-events-auto flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)]
        rounded-lg border-l-4 bg-white p-4 shadow-lg
        ${borderColorClass}
        mp-toast-enter
        ${isExiting ? 'mp-toast-exit' : ''}
      `}
    >
      <span className={`mt-0.5 flex-shrink-0 ${iconColor}`} aria-hidden="true">
        {toast.type === 'success' && <SuccessIcon />}
        {toast.type === 'error' && <ErrorIcon />}
        {toast.type === 'info' && <InfoIcon />}
      </span>

      <p className="flex-1 text-sm text-gray-800 leading-snug">
        {toast.message}
      </p>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Fechar notificação"
      >
        <CloseIcon />
      </button>
    </div>
  )
}

function SuccessIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        fill="currentColor"
      />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 8a1 1 0 100 2 1 1 0 000-2z"
        fill="currentColor"
      />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0 1 1 0 002 0zm-1 3a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z"
        fill="currentColor"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.293 4.293a1 1 0 011.414 0L8 6.586l2.293-2.293a1 1 0 111.414 1.414L9.414 8l2.293 2.293a1 1 0 01-1.414 1.414L8 9.414l-2.293 2.293a1 1 0 01-1.414-1.414L6.586 8 4.293 5.707a1 1 0 010-1.414z"
        fill="currentColor"
      />
    </svg>
  )
}
