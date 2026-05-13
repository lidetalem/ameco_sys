import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'

import LoginPage from './pages/Login/LoginPage'
import AdminDashboard from './pages/AdminDashboard/AdminDashboard'
import GuardDashboard from './pages/GuardDashboard/GuardDashboard'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

function RoleRouter() {
  const { user, loading } = useAuth()
  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'guard') return <Navigate to="/guard" replace />
  return <Navigate to="/login" replace />
}

function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center"
         style={{ background: 'var(--color-bg-main)' }}>
      <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
           style={{ borderColor: 'var(--color-ameco-red)', borderTopColor: 'transparent' }} />
      <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading AMECO…</p>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: 'var(--color-card-main)',
                    color: 'var(--color-text-main)',
                    border: '1px solid var(--color-border-main)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.875rem',
                  },
                }}
              />
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<RoleRouter />} />
                <Route path="/admin/*" element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/guard/*" element={
                  <ProtectedRoute role="guard">
                    <GuardDashboard />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}