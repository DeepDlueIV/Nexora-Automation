import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, CheckCheck, FileText, Inbox, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const steps = [
  {
    eyebrow: '01 / CAPTURE',
    title: 'Start with a simple trigger.',
    description: 'An invoice arrives. Your workflow gets to work, without another tab or another reminder.',
    icon: Inbox,
    label: 'New invoice received',
    detail: 'AWS · Monthly infrastructure',
    status: 'Ready to process',
  },
  {
    eyebrow: '02 / UNDERSTAND',
    title: 'Let your agent connect the dots.',
    description: 'The agent identifies the vendor, extracts the amount, and prepares the next step for your team.',
    icon: Sparkles,
    label: 'Invoice details organized',
    detail: 'Vendor: AWS · Amount: $5,200',
    status: 'Details extracted',
  },
  {
    eyebrow: '03 / REVIEW',
    title: 'Stay in control. Keep moving.',
    description: 'A clear, prepared task lands in the right place. Your team reviews the details and decides what happens next.',
    icon: CheckCheck,
    label: 'Ready for your review',
    detail: 'Finance team · Payment approval',
    status: 'Awaiting approval',
  },
]

export function ProductTour() {
  const [step, setStep] = useState(0)
  const reducedMotion = useReducedMotion()
  const current = steps[step]
  const Icon = current.icon

  return (
    <div className="mt-6">
      <div className="mb-6 flex items-center gap-2" aria-label={`Step ${step + 1} of ${steps.length}`}>
        {steps.map((item, index) => (
          <button
            type="button"
            key={item.eyebrow}
            aria-label={`Go to step ${index + 1}: ${item.title}`}
            aria-current={index === step ? 'step' : undefined}
            onClick={() => setStep(index)}
            className="group flex h-8 flex-1 items-center focus-visible:rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={cn('h-1 w-full rounded-full transition-colors', index <= step ? 'bg-accent' : 'bg-border group-hover:bg-muted-foreground/50')} />
          </button>
        ))}
      </div>

      <div className="min-h-[300px]" aria-live="polite" aria-atomic="true">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            <p className="text-[10px] font-semibold tracking-[0.16em] text-accent">{current.eyebrow}</p>
            <h3 className="mt-3 font-display text-3xl leading-tight">{current.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{current.description}</p>
            <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-accent">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium">{current.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{current.detail}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><FileText className="h-3.5 w-3.5" aria-hidden="true" /> Invoice #1042</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success"><Check className="h-3 w-3" aria-hidden="true" /> {current.status}</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
        <Button variant="ghost" size="sm" className="rounded-full" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
        </Button>
        <span className="text-xs tabular-nums text-muted-foreground">{step + 1} / {steps.length}</span>
        <Button size="sm" className="rounded-full" onClick={() => setStep((step + 1) % steps.length)}>
          {step === steps.length - 1 ? 'Replay' : 'Next step'} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
