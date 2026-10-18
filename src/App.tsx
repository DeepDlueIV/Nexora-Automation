import { useRef, useState } from 'react'
import { MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { Play } from 'lucide-react'
import { BackgroundVideo } from '@/components/background-video'
import { DashboardPreview } from '@/components/dashboard-preview'
import { Navbar } from '@/components/navbar'
import { SiteDialog, type SitePanel } from '@/components/site-dialog'
import { Button } from '@/components/ui/button'

export default function App() {
  const [panel, setPanel] = useState<SitePanel | null>(null)
  const lastTrigger = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()

  const openPanel = (next: SitePanel) => {
    lastTrigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setPanel(next)
  }

  const reveal = (y: number, duration: number, delay = 0) => ({
    initial: reducedMotion ? false as const : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reducedMotion ? 0 : duration, delay: reducedMotion ? 0 : delay },
  })

  return (
    <MotionConfig reducedMotion="user">
      <div id="home" className="page-shell flex h-screen flex-col overflow-hidden bg-background">
        <Navbar onOpen={openPanel} onHome={() => setPanel(null)} />

        <main aria-labelledby="hero-title" className="relative min-h-0 flex-1 overflow-hidden">
          <BackgroundVideo />

          <div className="hero-content relative z-10 flex w-full flex-col items-center px-6 md:px-10">
            <motion.div
              {...reveal(10, 0.5)}
              className="hero-badge mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-1.5 font-body text-sm text-muted-foreground"
            >
              Now with GPT-5 support <span aria-hidden="true">✨</span>
            </motion.div>

            <motion.h1
              id="hero-title"
              {...reveal(16, 0.6, 0.1)}
              className="hero-headline max-w-xl text-center font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-6xl md:leading-[0.95] lg:text-[5rem] lg:leading-[0.95]"
            >
              The Future of{' '}<br />
              <em className="font-normal">Smarter</em> Automation
            </motion.h1>

            <motion.p
              {...reveal(16, 0.6, 0.2)}
              className="hero-description mt-4 max-w-[650px] text-center font-body text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed"
            >
              Automate your busywork with intelligent agents that learn, adapt, and execute—so your team can focus on what matters most.
            </motion.p>

            <motion.div {...reveal(16, 0.6, 0.3)} className="hero-actions mt-5 flex items-center gap-3">
              <Button className="h-11 rounded-full px-6 py-5 font-body text-sm font-medium" onClick={() => openPanel('demo')} aria-haspopup="dialog">
                Book a demo
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hero-play-button h-11 w-11 rounded-full border-0 bg-background shadow-play hover:bg-background/80"
                aria-label="Play product demo"
                aria-haspopup="dialog"
                onClick={() => openPanel('tour')}
              >
                <Play className="ml-0.5 h-4 w-4 fill-foreground" strokeWidth={1.5} aria-hidden="true" />
              </Button>
            </motion.div>

            <motion.div {...reveal(30, 0.8, 0.5)} className="dashboard-position mt-8 w-full max-w-5xl">
              <DashboardPreview />
            </motion.div>
          </div>
        </main>
      </div>

      <SiteDialog panel={panel} onChange={setPanel} onRestoreFocus={() => lastTrigger.current?.focus()} />
    </MotionConfig>
  )
}
