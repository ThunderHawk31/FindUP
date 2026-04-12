import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

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
    // Lire la session Supabase existante au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? formatUser(session.user) : null)
      setLoading(false)
    })

    // Écouter les changements (refresh token, signOut...)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? formatUser(session.user) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email, password) {
    // 1. Appel backend → fait le login Supabase + pose le cookie HttpOnly
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',              // indispensable pour recevoir le cookie
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail || 'Email ou mot de passe incorrect')
    }

    // 2. Connecter aussi Supabase JS côté client (pour les appels directs au SDK)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    return data
  }

  async function register(email, password, name) {
    // 1. Appel backend → crée le compte Supabase + pose le cookie HttpOnly
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.detail || 'Erreur lors de l\'inscription')
    }

    // 2. Connecter Supabase JS côté client
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    return data
  }

  async function loginWithGoogle() {
    // OAuth : Supabase gère le redirect, le cookie backend sera absent
    // (nécessite un endpoint callback côté backend pour le poser — hors scope)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' }
    })
    if (error) throw error
  }

  async function logout() {
    // 1. Supprimer le cookie côté serveur en premier
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(() => { }) // non bloquant

    // 2. Déconnecter Supabase JS
    await supabase.auth.signOut()

    setUser(null)
    window.location.href = '/'
  }

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  }

  return { user, loading, login, register, loginWithGoogle, logout, getToken }
}