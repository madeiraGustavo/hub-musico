/**
 * CheckoutStepper — visual progress indicator for the checkout flow.
 * Renders 3 steps: Carrinho, Dados, Confirmação with completed/active/disabled states.
 */

export type CheckoutStep = 'cart' | 'data' | 'confirmation'

export interface CheckoutStepperProps {
  currentStep: CheckoutStep
  completedSteps: CheckoutStep[]
}

interface StepState {
  step: CheckoutStep
  label: string
  state: 'completed' | 'active' | 'disabled'
}

const STEPS: Array<{ step: CheckoutStep; label: string }> = [
  { step: 'cart', label: 'Carrinho' },
  { step: 'data', label: 'Dados' },
  { step: 'confirmation', label: 'Confirmação' },
]

/**
 * Pure function that derives the visual state of each step.
 * - If step is in completedSteps → 'completed'
 * - If step === currentStep → 'active'
 * - Otherwise → 'disabled'
 */
export function deriveStepStates(
  currentStep: CheckoutStep,
  completedSteps: CheckoutStep[]
): StepState[] {
  return STEPS.map(({ step, label }) => {
    let state: StepState['state']
    if (completedSteps.includes(step)) {
      state = 'completed'
    } else if (step === currentStep) {
      state = 'active'
    } else {
      state = 'disabled'
    }
    return { step, label, state }
  })
}

export function CheckoutStepper({ currentStep, completedSteps }: CheckoutStepperProps) {
  const steps = deriveStepStates(currentStep, completedSteps)

  return (
    <nav aria-label="Progresso do checkout" className="w-full py-4">
      <ol className="flex items-center justify-between">
        {steps.map((stepItem, index) => (
          <li key={stepItem.step} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold
                  transition-colors duration-200
                  ${stepItem.state === 'completed'
                    ? 'bg-[#16a34a] text-white'
                    : stepItem.state === 'active'
                      ? 'bg-[var(--mp-accent)] text-white'
                      : 'bg-[var(--mp-bg-muted)] text-[var(--mp-text-muted)]'
                  }
                `}
                aria-current={stepItem.state === 'active' ? 'step' : undefined}
              >
                {stepItem.state === 'completed' ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`
                  text-xs whitespace-nowrap
                  ${stepItem.state === 'active'
                    ? 'font-bold text-[var(--mp-text-default)]'
                    : stepItem.state === 'completed'
                      ? 'font-medium text-[var(--mp-text-secondary)]'
                      : 'font-normal text-[var(--mp-text-muted)]'
                  }
                `}
              >
                {stepItem.label}
              </span>
            </div>

            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <div
                className={`
                  flex-1 h-0.5 mx-3
                  ${stepItem.state === 'completed'
                    ? 'bg-[#16a34a]'
                    : 'bg-[var(--mp-border-default)]'
                  }
                `}
                aria-hidden="true"
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
