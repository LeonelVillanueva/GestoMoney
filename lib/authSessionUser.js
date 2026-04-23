import { createAuthServerClient } from './authServerClient.js'
import { clearAuthCookies, getAuthTokensFromRequest } from './authHttpOnly.js'

export async function getServerSessionFromCookies(req, res) {
  const { accessToken, refreshToken } = getAuthTokensFromRequest(req)
  if (!refreshToken) return null

  const supabase = createAuthServerClient()
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken || '',
    refresh_token: refreshToken
  })

  if (error || !data?.session) {
    if (res) clearAuthCookies(res)
    return null
  }

  return {
    supabase,
    session: data.session,
    user: data.session.user
  }
}
