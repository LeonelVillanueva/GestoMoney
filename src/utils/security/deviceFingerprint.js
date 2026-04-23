async function sha256Hex(value) {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  const bytes = Array.from(new Uint8Array(digest))
  return bytes.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function getDeviceFingerprint() {
  const seedKey = 'gg_device_seed_v1'
  let seed = localStorage.getItem(seedKey)
  if (!seed) {
    seed = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
    localStorage.setItem(seedKey, seed)
  }

  const base = [
    navigator.userAgent || 'na',
    navigator.platform || 'na',
    navigator.language || 'na',
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'na',
    screen.width || 0,
    screen.height || 0,
    seed
  ].join('|')

  return sha256Hex(base)
}
