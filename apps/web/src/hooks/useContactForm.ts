'use client'

import { useState } from 'react'

interface FormState {
  nome: string
  email: string
  servico: string
  mensagem: string
}

interface FeedbackState {
  type: 'success' | 'error' | null
  message: string
}

const INITIAL: FormState = { nome: '', email: '', servico: '', mensagem: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function useContactForm() {
  const [form, setForm]         = useState<FormState>(INITIAL)
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, message: '' })
  const [loading, setLoading]   = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function validate(): string | null {
    if (!form.nome.trim())                    return 'Por favor, informe seu nome.'
    if (!EMAIL_RE.test(form.email.trim()))    return 'Por favor, informe um email válido.'
    if (!form.mensagem.trim())                return 'Por favor, escreva uma mensagem.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback({ type: null, message: '' })

    const error = validate()
    if (error) {
      setFeedback({ type: 'error', message: error })
      return
    }

    setLoading(true)
    // Simulação — substituir por chamada real à API na FASE 2
    await new Promise(resolve => setTimeout(resolve, 1200))
    setFeedback({ type: 'success', message: 'Mensagem enviada! Responderei em até 24 horas.' })
    setForm(INITIAL)
    setLoading(false)
  }

  return { form, feedback, loading, handleChange, handleSubmit }
}
