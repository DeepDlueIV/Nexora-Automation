const bookingUrl = import.meta.env.VITE_BOOKING_URL?.trim() ?? ''
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim() ?? ''

function validBookingUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : undefined
  } catch {
    return undefined
  }
}

export const siteConfig = {
  bookingUrl: validBookingUrl(bookingUrl),
  contactEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) ? contactEmail : undefined,
  videoUrl:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4',
}
