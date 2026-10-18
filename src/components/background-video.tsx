import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { siteConfig } from '@/lib/site-config'

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const synchronizePlayback = () => {
      if (document.hidden || reducedMotion) {
        video.pause()
      } else {
        // Autoplay can be refused by a device's power or data-saving policy.
        // The local poster remains visible when that happens.
        void video.play().catch(() => undefined)
      }
    }

    synchronizePlayback()
    document.addEventListener('visibilitychange', synchronizePlayback)
    return () => document.removeEventListener('visibilitychange', synchronizePlayback)
  }, [reducedMotion])

  return (
    <div className="hero-backdrop pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <video
        ref={videoRef}
        className="hero-video absolute inset-0 h-full w-full object-cover"
        autoPlay={!reducedMotion}
        muted
        loop
        playsInline
        preload={reducedMotion ? 'none' : 'auto'}
        poster="/forest-poster.webp"
        tabIndex={-1}
      >
        <source src={siteConfig.videoUrl} type="video/mp4" />
      </video>
    </div>
  )
}
