import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

/**
 * Hook partagé d'authentification Supabase.
 * Retourne { user, loading, login, register, loginWithGoogle, logout }
 *
 * user = null (pas connecté) ou { id, email, name, initials, picture }
 */

const API_URL = import.meta.env.VITE_API_URL || 'https://alert-cat-production.up.railway.app'

function buildInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatUser(supaUser) {
  if (!supaUser) return null
  const meta = supaUser.user_metadata || {}
  const name = meta.name || meta.full_name || supaUser.email?.split('@')[0] || ''
  return {
    id: supaUser.id,
    email: supaUser.email,
    name,
    initials: buildInitials(name),
    picture: meta.picture || meta.avatar_url || null
  }
}

export default function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupérer la session active
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? formatUser(session.user) : null)
      setLoading(false)
    })

    // Écouter les changements d'auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? formatUser(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function register(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    if (error) throw error
    return data
  }

  async function loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' }
    })
    if (error) throw error
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  /** Récupère le token JWT pour les appels API backend */
  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  return { user, loading, login, register, loginWithGoogle, logout, getToken }
}
