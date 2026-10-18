import * as Dialog from '@radix-ui/react-dialog'
import { ArrowUpRight, Check, Mail, Play, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductTour } from '@/components/product-tour'
import { siteConfig } from '@/lib/site-config'

export type SitePanel = 'demo' | 'tour' | 'pricing' | 'about' | 'contact'

const content: Record<SitePanel, { label: string; title: string; description: string }> = {
  demo: {
    label: 'MEET NEXORA',
    title: 'Make room for what matters.',
    description: 'See how intelligent automation can fit the way your team works.',
  },
  tour: {
    label: 'THE INTERACTIVE TOUR',
    title: 'From busywork to done.',
    description: 'Follow an example invoice workflow in three simple steps.',
  },
  pricing: {
    label: 'PRICING',
    title: 'Built around your workflow.',
    description: 'The right plan starts with understanding your team and the work you want to automate.',
  },
  about: {
    label: 'ABOUT NEXORA',
    title: 'A little less work. A lot more possibility.',
    description: 'Nexora brings intelligent agents to the everyday work that gets in your way.',
  },
  contact: {
    label: 'LET’S CONNECT',
    title: 'What would you like to automate?',
    description: 'Product questions, a new workflow, or a tailored demo—start a conversation with Nexora.',
  },
}

function TourButton({ onClick }: { onClick: () => void }) {
  return (
    <Button className="mt-6 h-auto min-h-10 max-w-full whitespace-normal rounded-full px-5 py-3" onClick={onClick}>
      <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> <span>Explore the interactive demo</span>
    </Button>
  )
}

interface SiteDialogProps {
  panel: SitePanel | null
  onChange: (panel: SitePanel | null) => void
  onRestoreFocus: () => void
}

export function SiteDialog({ panel, onChange, onRestoreFocus }: SiteDialogProps) {
  const current = panel ? content[panel] : content.demo

  return (
    <Dialog.Root open={panel !== null} onOpenChange={(open) => { if (!open) onChange(null) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/25 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="dialog-scroll fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 font-body text-foreground shadow-dialog outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-1/2 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-1/2 sm:p-8"
          onCloseAutoFocus={(event) => { event.preventDefault(); onRestoreFocus() }}
        >
          <p className="pr-8 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground">{current.label}</p>
          <Dialog.Title className="mt-4 pr-4 font-display text-4xl leading-[1.05] tracking-tight">{current.title}</Dialog.Title>
          <Dialog.Description className="mt-4 text-sm leading-relaxed text-muted-foreground">{current.description}</Dialog.Description>

          {panel === 'tour' && <ProductTour />}

          {panel === 'about' && (
            <>
              <div className="mt-6 space-y-4 rounded-xl bg-secondary/70 p-5">
                {[
                  ['Learn', 'Turn incoming information into a clear next step.'],
                  ['Adapt', 'Build workflows around the way your team operates.'],
                  ['Execute', 'Prepare the work, with your team in control.'],
                ].map(([title, description]) => (
                  <div key={title} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"><Check className="h-3 w-3" aria-hidden="true" /></span>
                    <p className="text-sm leading-relaxed"><span className="font-medium">{title}.</span> <span className="text-muted-foreground">{description}</span></p>
                  </div>
                ))}
              </div>
              <TourButton onClick={() => onChange('tour')} />
            </>
          )}

          {panel === 'pricing' && (
            <>
              <div className="mt-6 rounded-xl border border-border p-5">
                <p className="text-sm font-medium">Your team. Your workflows.</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Plan details and pricing are not published yet. Explore the product or ask about a tailored demo.</p>
              </div>
              <Button className="mt-6 rounded-full px-5" onClick={() => onChange('demo')}>Book a demo <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Button>
            </>
          )}

          {(panel === 'demo' || panel === 'contact') && (
            <div className="mt-6">
              {panel === 'demo' && siteConfig.bookingUrl ? (
                <Button asChild className="rounded-full px-5">
                  <a href={siteConfig.bookingUrl} target="_blank" rel="noopener noreferrer">Choose a time <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
                </Button>
              ) : siteConfig.contactEmail ? (
                <Button asChild className="max-w-full rounded-full px-5">
                  <a href={`mailto:${siteConfig.contactEmail}?subject=${encodeURIComponent(panel === 'demo' ? 'Nexora demo request' : 'Hello, Nexora')}`}>
                    <Mail className="h-4 w-4" aria-hidden="true" /> {panel === 'demo' ? 'Request a demo' : 'Email Nexora'}
                  </a>
                </Button>
              ) : (
                <p className="rounded-xl border border-border bg-secondary/40 p-5 text-sm leading-relaxed text-muted-foreground">
                  {panel === 'demo' ? 'Live demo scheduling is currently unavailable.' : 'Contact details have not been published yet.'} You can explore the interactive walkthrough in the meantime.
                </p>
              )}
              <div><TourButton onClick={() => onChange('tour')} /></div>
            </div>
          )}

          <Dialog.Close asChild>
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 h-9 w-9 rounded-full text-muted-foreground" aria-label="Close dialog">
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
