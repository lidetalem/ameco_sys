import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import { useLang } from '../../context/LanguageContext'

import AdminOverview     from './AdminOverview'
import AdminsPage        from './AdminsPage'
import GuardsPage        from './GuardsPage'
import StaffPage         from './StaffPage'
import VisitorsPage      from './VisitorsPage'
import CamerasPage       from './CamerasPage'
import LogsPage          from './LogsPage'
import NotificationsPage from './NotificationsPage'
import SettingsPage      from './SettingsPage'

const PAGE_TITLES = {
  '':              'dashboard',
  'admins':        'admins',
  'guards':        'guards',
  'staff':         'staff',
  'visitors':      'visitors',
  'cameras':       'cameras',
  'logs':          'logs',
  'notifications': 'notifications',
  'settings':      'settings',
}

export default function AdminDashboard() {
  const { t } = useLang()

  // Derive page title from current path segment
  const segment = window.location.pathname.split('/admin/')[1]?.split('/')[0] || ''
  const title   = t(PAGE_TITLES[segment] || 'dashboard')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg-main)' }}>
      <Sidebar role="admin" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="admins/*"        element={<AdminsPage />} />
            <Route path="guards/*"        element={<GuardsPage />} />
            <Route path="staff/*"         element={<StaffPage />} />
            <Route path="visitors/*"      element={<VisitorsPage />} />
            <Route path="cameras/*"       element={<CamerasPage />} />
            <Route path="logs/*"          element={<LogsPage />} />
            <Route path="notifications/*" element={<NotificationsPage />} />
            <Route path="settings/*"      element={<SettingsPage />} />
            <Route path="*"               element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}