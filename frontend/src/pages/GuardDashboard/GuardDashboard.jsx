import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import { useLang } from '../../context/LanguageContext'

import GuardOverview      from './GuardOverview'
import GuardVisitorsPage  from './GuardVisitorsPage'
import GuardRequestsPage  from './GuardRequestsPage'
import NotificationsPage  from '../AdminDashboard/NotificationsPage'
import SettingsPage       from '../AdminDashboard/SettingsPage'

const PAGE_TITLES = {
  '':              'dashboard',
  'visitors':      'visitors',
  'requests':      'request',
  'notifications': 'notifications',
  'settings':      'settings',
}

export default function GuardDashboard() {
  const { t } = useLang()
  const segment = window.location.pathname.split('/guard/')[1]?.split('/')[0] || ''
  const title   = t(PAGE_TITLES[segment] || 'dashboard')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg-main)' }}>
      <Sidebar role="guard" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index                  element={<GuardOverview />} />
            <Route path="visitors/*"      element={<GuardVisitorsPage />} />
            <Route path="requests/*"      element={<GuardRequestsPage />} />
            <Route path="notifications/*" element={<NotificationsPage />} />
            <Route path="settings/*"      element={<SettingsPage />} />
            <Route path="*"               element={<Navigate to="/guard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}