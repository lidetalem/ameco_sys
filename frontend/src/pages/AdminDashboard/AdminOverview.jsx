import React, { useEffect, useState } from 'react'
import { Users, Shield, UserCheck, Camera, Activity, TrendingUp } from 'lucide-react'
import StatCard from '../../components/StatCard'
import DataTable from '../../components/DataTable'
import { staffAPI, guardsAPI, visitorsAPI, camerasAPI, logsAPI } from '../../services/api'
import { useLang } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

export default function AdminOverview() {
  const { t }    = useLang()
  const { user } = useAuth()

  const [stats, setStats]   = useState({ staff: 0, guards: 0, visitors: 0, cameras: 0 })
  const [logs, setLogs]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      staffAPI.list(),
      guardsAPI.list(),
      visitorsAPI.list(),
      camerasAPI.list(),
      logsAPI.history(),
    ]).then(([s, g, v, c, l]) => {
      setStats({
        staff:    s.data.length ?? s.data.count ?? 0,
        guards:   g.data.length ?? g.data.count ?? 0,
        visitors: v.data.length ?? v.data.count ?? 0,
        cameras:  c.data.length ?? c.data.count ?? 0,
      })
      setLogs((l.data.results || l.data).slice(0, 20))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const logColumns = [
    {
      key: 'ethiopian_time',
      label: t('timestamp'),
      render: (v) => <span className="font-mono text-xs">{v}</span>,
    },
    { key: 'actor_username', label: 'Actor' },
    {
      key: 'action_type',
      label: t('action'),
      render: (v) => {
        const colors = {
          SCAN_ACCEPTED: '#22c55e',
          SCAN_REJECTED: '#ef4444',
          LOGIN: '#3b82f6',
          LOGOUT: '#6b7280',
          SPOOF_DETECTED: '#f59e0b',
          ATTEMPT_LIMIT: '#7c3aed',
        }
        return (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: `${colors[v] || '#6b7280'}22`,
              color: colors[v] || '#6b7280',
              border: `1px solid ${colors[v] || '#6b7280'}44`,
            }}>
            {v}
          </span>
        )
      },
    },
    { key: 'description', label: 'Description' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-2xl px-6 py-5"
           style={{
             background: 'linear-gradient(135deg, rgba(204,0,0,0.15), rgba(136,0,0,0.08))',
             border: '1px solid rgba(204,0,0,0.2)',
           }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('welcome')},</p>
        <h2 className="text-2xl font-black mt-0.5" style={{ color: 'var(--color-text-main)' }}>
          {user?.full_name || user?.username}
        </h2>
        <p className="text-sm capitalize mt-1" style={{ color: 'var(--color-ameco-red)' }}>
          {user?.role} · AMECO Access Control
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}     label={t('totalStaff')}    value={stats.staff}    color="#3b82f6" />
        <StatCard icon={Shield}    label={t('totalGuards')}   value={stats.guards}   color="#8b5cf6" />
        <StatCard icon={UserCheck} label={t('totalVisitors')} value={stats.visitors} color="#f59e0b" />
        <StatCard icon={Camera}    label={t('totalCameras')}  value={stats.cameras}  color="#cc0000" />
      </div>

      {/* Recent logs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} style={{ color: 'var(--color-ameco-red)' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-main)' }}>
            {t('accessLogs')} — Recent
          </h3>
        </div>
        <DataTable
          columns={logColumns}
          data={logs}
          loading={loading}
          searchKeys={['actor_username', 'action_type', 'description']}
          pageSize={10}
        />
      </div>
    </div>
  )
}