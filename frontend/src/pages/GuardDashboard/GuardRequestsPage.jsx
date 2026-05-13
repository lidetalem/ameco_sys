import React, { useEffect, useState } from 'react'
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { requestsAPI, visitorsAPI } from '../../services/api'
import { useLang } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import wsManager from '../../services/websocket'

export default function GuardRequestsPage() {
  const { t }    = useLang()
  const { user } = useAuth()

  const [requests, setRequests] = useState([])
  const [visitors, setVisitors] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showNew, setShowNew]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm] = useState({
    temp_user: '',
    reason: '',
    start_date: '',
    end_date: '',
  })

  const load = () => {
    setLoading(true)
    Promise.all([requestsAPI.list(), visitorsAPI.list()])
      .then(([r, v]) => {
        setRequests(r.data.results || r.data)
        setVisitors(v.data.results || v.data)
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Real-time update when admin approves/denies
  useEffect(() => {
    const unsub = wsManager.on('request_decision', (data) => {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === data.request_id
            ? { ...r, status: data.status, denial_reason: data.denial_reason }
            : r
        )
      )
      const msg = data.status === 'APPROVED'
        ? `✅ Request for ${data.visitor_name} approved!`
        : `❌ Request for ${data.visitor_name} denied.`
      toast(msg)
    })
    return unsub
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.temp_user) {
      toast.error('Please select a visitor')
      return
    }
    setSaving(true)
    try {
      await requestsAPI.create({
        ...form,
        temp_user: parseInt(form.temp_user),
      })
      toast.success('Request submitted!')
      setShowNew(false)
      setForm({ temp_user: '', reason: '', start_date: '', end_date: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    } finally {
      setSaving(false)
    }
  }

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const STATUS_CONFIG = {
    PENDING:  { color: '#f59e0b', icon: Clock,       label: 'Pending' },
    APPROVED: { color: '#22c55e', icon: CheckCircle,  label: 'Approved' },
    REJECTED: { color: '#ef4444', icon: XCircle,      label: 'Denied' },
  }

  const columns = [
    {
      key: 'visitor_name',
      label: 'Visitor',
      render: (v, row) => (
        <div className="flex items-center gap-2">
          {row.visitor_image && (
            <img src={row.visitor_image} alt=""
                 className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          )}
          <div>
            <p className="font-semibold text-sm">{v || '—'}</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {row.visitor_phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      label: t('reason'),
      render: (v) => (
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{v || '—'}</span>
      ),
    },
    { key: 'start_date', label: t('startDate') },
    { key: 'end_date',   label: t('endDate') },
    {
      key: 'status',
      label: t('status'),
      render: (v) => {
        const cfg = STATUS_CONFIG[v] || STATUS_CONFIG.PENDING
        const Icon = cfg.icon
        return (
          <div className="flex items-center gap-1.5">
            <Icon size={13} style={{ color: cfg.color }} />
            <span className="text-xs font-bold" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
        )
      },
    },
    {
      key: 'denial_reason',
      label: 'Denial Reason',
      render: (v) => v
        ? <span className="text-xs" style={{ color: '#ef4444' }}>{v}</span>
        : <span style={{ color: 'var(--color-text-muted)' }}>—</span>,
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      render: (v) => v
        ? <span className="text-xs font-mono">{new Date(v).toLocaleDateString()}</span>
        : '—',
    },
  ]

  const pending  = requests.filter((r) => r.status === 'PENDING').length
  const approved = requests.filter((r) => r.status === 'APPROVED').length
  const denied   = requests.filter((r) => r.status === 'REJECTED').length

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)' }}>
          {t('myRequests')}
          <span className="text-sm font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>
            ({requests.length})
          </span>
        </h3>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#cc0000,#aa0000)' }}>
          <Plus size={15} /> New Request
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('pending'),  value: pending,  color: '#f59e0b' },
          { label: t('approved'), value: approved, color: '#22c55e' },
          { label: t('denied'),   value: denied,   color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label}
               className="rounded-2xl p-4 text-center"
               style={{
                 background: `${color}10`,
                 border: `1px solid ${color}30`,
               }}>
            <p className="text-2xl font-black" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5 font-semibold" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={requests}
        loading={loading}
        searchKeys={['visitor_name', 'reason', 'status']}
        pageSize={10}
      />

      {/* New Request Modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="Submit Visitor Request"
        width="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                   style={{ color: 'var(--color-text-muted)' }}>
              Select Visitor *
            </label>
            <select
              className="ameco-input"
              value={form.temp_user}
              onChange={setF('temp_user')}
              required>
              <option value="">— Choose a visitor —</option>
              {visitors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.first_name} {v.middle_name} {v.last_name}
                  {v.digital_id ? ` (${v.digital_id})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                   style={{ color: 'var(--color-text-muted)' }}>
              {t('reason')}
            </label>
            <textarea
              className="ameco-input"
              rows={3}
              value={form.reason}
              onChange={setF('reason')}
              placeholder="Reason for visit…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                     style={{ color: 'var(--color-text-muted)' }}>
                {t('startDate')}
              </label>
              <input
                type="date"
                className="ameco-input"
                value={form.start_date}
                onChange={setF('start_date')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                     style={{ color: 'var(--color-text-muted)' }}>
                {t('endDate')}
              </label>
              <input
                type="date"
                className="ameco-input"
                value={form.end_date}
                onChange={setF('end_date')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t"
               style={{ borderColor: 'var(--color-border-main)' }}>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: 'var(--color-card-hover)',
                border: '1px solid var(--color-border-main)',
                color: 'var(--color-text-muted)',
              }}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: 'linear-gradient(135deg,#cc0000,#aa0000)',
                opacity: saving ? 0.6 : 1,
              }}>
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}