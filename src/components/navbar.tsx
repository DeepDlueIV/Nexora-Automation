import { Button } from '@/components/ui/button'
import type { SitePanel } from '@/components/site-dialog'

interface NavbarProps {
  onOpen: (panel: SitePanel) => void
  onHome: () => void
}

export function Navbar({ onOpen, onHome }: NavbarProps) {
  return (
    <header className="site-navbar relative z-20 flex shrink-0 items-center justify-between bg-background px-6 py-5 font-body md:px-12 lg:px-20">
      <a
        className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
        href="#home"
        aria-label="Nexora home"
        onClick={onHome}
      >
        <span aria-hidden="true" className="text-[26px] leading-none">✦</span>
        Nexora
      </a>

      <div className="flex items-center gap-8">
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          <a
            href="#home"
            aria-current="page"
            onClick={onHome}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          >
            Home
          </a>
          {(['pricing', 'about', 'contact'] as const).map((panel) => (
            <button
              key={panel}
              type="button"
              onClick={() => onOpen(panel)}
              aria-haspopup="dialog"
              className="text-sm capitalize text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
            >
              {{ pricing: 'Pricing', about: 'About', contact: 'Contact' }[panel]}
            </button>
          ))}
        </nav>
        <Button className="rounded-full px-5 text-sm font-medium" onClick={() => onOpen('demo')} aria-haspopup="dialog">
          Get started
        </Button>
      </div>
    </header>
  )
}
