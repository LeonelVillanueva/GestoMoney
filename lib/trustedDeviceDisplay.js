/**
 * Clasificación y resumen de dispositivo para mostrar en UI (servidor o tests).
 * @param {string} [userAgent]
 * @returns {'mobile' | 'tablet' | 'desktop' | 'unknown'}
 */
export function deviceTypeFromUserAgent(userAgent) {
  const ua = String(userAgent || '')
  if (!ua.trim()) return 'unknown'
  const s = ua.toLowerCase()

  // Escritorio (prioridad). El patrón aislado /mobi/ coincidía con "Mobi" en "Mobile" y
  // podía etiquetar UAs de Windows como móviles.
  if (/\(windows nt/i.test(ua) && (/\bwin64\b|wow64|x64\)/i.test(ua) || /;\s*win32\)/i.test(ua))) {
    if (!/phone|windows phone|android;|webos;|iphone; cpu|ipod;|iemobile|bb10; cpu|wpdesktop/i.test(ua)) {
      return 'desktop'
    }
  }
  if (/\(macintosh; intel mac os x\)/i.test(ua)) {
    if (
      !/cpu iphone|cpu ipod|crios\//.test(ua) &&
      !/mobile safari\//i.test(ua) &&
      !/android;|webos;|windows phone|iemobile|iphone; cpu|ipod; cpu/i.test(ua)
    ) {
      return 'desktop'
    }
  }
  if (/\(x11; linux[^(]*\b(x86_64|i686)\b/i.test(ua) && !/android/i.test(ua) && !/ubuntu touch; mobile/i.test(ua)) {
    return 'desktop'
  }
  if (/\(x11;.*cr[Oo][Ss] [^)]+\) applewebkit/i.test(ua) && !/android; cros; mobile/i.test(ua) && !/phone|iemobile/i.test(ua)) {
    return 'desktop'
  }

  if (/ipad|tablet|playbook|nexus 7|nexus 9|silk(?!-accelerated)/i.test(ua) && !/mobile/i.test(ua)) {
    return 'tablet'
  }
  // Sin /mobi/ suelto: coincidía "Mobi" dentro de "Mobile". Se añadieron señales explícitas.
  if (
    /iphone|ipod|android(?!.*tablet)|webos|blackberry|bb10|iemobile|wpdesktop|operamobile|opera mobi|fennec|mobile safari\//i.test(ua) ||
    (s.includes('android') && s.includes('mobile') && !/android.*tablet/i.test(ua))
  ) {
    return 'mobile'
  }
  if (/android.*tablet|kindle|silk|ipad/i.test(ua)) {
    return 'tablet'
  }
  return 'desktop'
}

/**
 * Título legible a partir de User-Agent (breve).
 */
export function browserLabelFromUserAgent(ua) {
  const s = String(ua || '')
  if (!s.trim()) return 'Desconocido'
  if (/Edg\//.test(ua)) return 'Microsoft Edge'
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'Opera'
  if (/CriOS/.test(ua)) return 'Chrome (iOS)'
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome'
  if (/Chromium/.test(ua)) return 'Chromium'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari'
  if (/MSIE|Trident/.test(ua)) return 'Internet Explorer'
  return s.length > 60 ? `${s.slice(0, 57)}…` : s
}
