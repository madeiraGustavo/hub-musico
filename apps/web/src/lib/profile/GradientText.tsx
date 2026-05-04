'use client'

import { useId } from 'react'

interface Props {
  gradient:   string   // valor CSS direto ou var(--profile-gradient)
  children:   React.ReactNode
  className?: string
}

export function GradientText({ gradient, children, className = '' }: Props) {
  const uid = useId().replace(/:/g, 'x')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .gt-${uid} {
          background: ${gradient};
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline;
        }
      ` }} />
      <span className={`gt-${uid} ${className}`}>{children}</span>
    </>
  )
}
