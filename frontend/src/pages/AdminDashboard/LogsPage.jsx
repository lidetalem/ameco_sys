import React, { useEffect, useState } from 'react'
import { Download, Filter, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import { logsAPI } from '../../services/api'
import { useLang } from '../../context/LanguageContext'

const ACTION_COLORS = {
  SCAN_ACCEPTED:   '#22c55e',
  SCAN_REJECTED:   '#ef4444',
  LOGIN:           '#3b82f6',
  LOGOUT:          '#6b7280',
  SPOOF_DETECTED:  '#f59e0b',
  ATTEMPT_LIMIT:   '#7c3aed',
  REGISTER:        '#06b6d4',
  DELETE:          '#ef4444',
  CAMERA_POWER:    '#f59e0b',
  REQUEST_APPROVE: '#22c55e',
  REQUEST_DENY:    '#ef4444',
}

export default function LogsPage() {
  const { t } = useLang()
  const [logs, setLogs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate]     = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const load = () => {
    setLoading(true)
    const params = {}
    if (fromDate) params.from = fromDate
    if (toDate)   params.to   = toDate
    logsAPI.history(params)
      .then((r) => setLogs(r.data.results || r.data))
      .catch(() => toast.error('Failed to load logs'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleExport = async () => {
    try {
      const params = {}
      if (fromDate) params.from = fromDate
      if (toDate)   params.to   = toDate
      const response = await logsAPI.exportCsv(params)
      const url  = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href  = url
      link.setAttribute('download', `ameco_logs_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('CSV downloaded!')
    } catch {
      toast.error('Export failed')
    }
  }

  const actionTypes = [...new Set(logs.map((l) => l.action_type))].sort()

  const filtered = actionFilter
    ? logs.filter((l) => l.action_type === actionFilter)
    : logs

  const columns = [
    {
      key: 'ethiopian_time',
      label: t('timestamp'),
      render: (v) => (
        <span className="font-mono text-xs whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'actor_username',
      label: 'Actor',
      render: (v, row) => (
        <div>
          <p className="text-sm font-semibold">{v || '—'}</p>
          <p className="text-xs capitalize" style={{ color: 'var(--color-text-muted)' }}>{row.actor_role}</p>
        </div>
      ),
    },
    {
      key: 'action_type',
      label: t('action'),
      render: (v) => {
        const color = ACTION_COLORS[v] || '#6b7280'
        return (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}>
            {v}
          </span>
        )
      },
    },
    {
      key: 'description',
      label: 'Description',
      render: (v) => (
        <span className="text-sm" style={{ color: 'var(--color-text-main)' }}>{v || '—'}</span>
      ),
    },
    {
      key: 'gate_camera_id',
      label: 'Gate / Camera',
      render: (v) => (
        <span className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>{v || '—'}</span>
      ),
    },
    {
      key: 'confidence',
      label: t('confidence'),
      render: (v) => v != null
        ? <span className="text-xs font-semibold" style={{ color: '#22c55e' }}>{v}%</span>
        : <span style={{ color: 'var(--color-text-muted)' }}>—</span>,
    },
  ]

  return (
    <div className="space-y-4">

      {/* Controls */}
      <div className="rounded-2xl p-4 flex flex-wrap items-end gap-3"
           style={{ background: 'var(--color-card-main)', border: '1px solid var(--color-border-main)' }}>

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                 style={{ color: 'var(--color-text-muted)' }}>From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="ameco-input py-2 text-sm"
            style={{ width: '160px' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                 style={{ color: 'var(--color-text-muted)' }}>To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="ameco-input py-2 text-sm"
            style={{ width: '160px' }}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                 style={{ color: 'var(--color-text-muted)' }}>{t('action')} Type</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="ameco-input py-2 text-sm"
            style={{ width: '180px' }}>
            <option value="">All Actions</option>
            {actionTypes.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'var(--color-card-hover)',
              border: '1px solid var(--color-border-main)',
              color: 'var(--color-text-muted)',
            }}>
            <RefreshCw size={14} /> {t('filter')}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#cc0000,#aa0000)' }}>
            <Download size={14} /> {t('export')} CSV
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(
          filtered.reduce((acc, l) => {
            acc[l.action_type] = (acc[l.action_type] || 0) + 1
            return acc
          }, {})
        ).slice(0, 6).map(([type, count]) => {
          const color = ACTION_COLORS[type] || '#6b7280'
          return (
            <span
              key={type}
              className="text-xs font-semibold px-3 py-1 rounded-full cursor-pointer"
              style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
              onClick={() => setActionFilter(actionFilter === type ? '' : type)}>
              {type}: {count}
            </span>
          )
        })}
        {filtered.length > 0 && (
          <span className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'var(--color-card-hover)', color: 'var(--color-text-muted)' }}>
            Total: {filtered.length}
          </span>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        searchKeys={['actor_username', 'action_type', 'description', 'gate_camera_id']}
        pageSize={15}
      />
    </div>
  )
}