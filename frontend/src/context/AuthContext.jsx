import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'
import wsManager from '../services/websocket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const access  = localStorage.getItem('access_token')
    const stored  = localStorage.getItem('user_data')
    if (access && stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        wsManager.connect(parsed.username)
      } catch (_) {
        localStorage.clear()
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const { data } = await authAPI.login({ username, password })
    localStorage.setItem('access_token',  data.access)
    localStorage.setItem('refresh_token', data.refresh)
    const userData = {
      id:              data.user_id,
      username:        data.username,
      role:            data.role,
      full_name:       data.full_name,
      profile_image_url: data.profile_image_url,
    }
    localStorage.setItem('user_data', JSON.stringify(userData))
    setUser(userData)
    wsManager.connect(data.username)
    return userData
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token')
    try { await authAPI.logout(refresh) } catch (_) {}
    wsManager.disconnect()
    localStorage.clear()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)