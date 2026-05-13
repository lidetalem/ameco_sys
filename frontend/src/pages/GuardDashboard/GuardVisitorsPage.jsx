import React, { useEffect, useState } from 'react'
import { Plus, Eye, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import RegistrationForm from '../../components/RegistrationForm'
import { visitorsAPI } from '../../services/api'
import { useLang } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

export default function GuardVisitorsPage() {
  const { t }    = useLang()
  const { user } = useAuth()

  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [viewItem, setViewItem] = useState(null)

  const load = () => {
    setLoading(true)
    visitorsAPI.list()
      .then((r) => setData(r.data.results || r.data))
      .catch(() => toast.error('Failed to load visitors'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (form) => {
    setSaving(true)
    try {
      await visitorsAPI.create({
        ...form,
        registered_by: user?.username || 'guard',
      })
      toast.success('Visitor registered!')
      setShowAdd(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      await visitorsAPI.delete(id)
      toast.success('Deleted')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  const columns = [
    {
      key: 'profile_image',
      label: '',
      render: (v, row) => (
        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0"
             style={{ background: 'var(--color-card-hover)' }}>
          {v
            ? <img src={v} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-sm font-bold"
                   style={{ color: '#f59e0b' }}>
                {row.first_name?.[0]?.toUpperCase()}
              </div>
          }
        </div>
      ),
    },
    {
      key: 'first_name',
      label: 'Name',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-sm">
            {row.first_name} {row.middle_name} {row.last_name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.digital_id}</p>
        </div>
      ),
    },
    { key: 'phone', label: t('phone') },
    {
      key: 'date_of_expiry',
      label: t('endDate'),
      render: (v) => {
        if (!v) return '—'
        const expired = v < today
        return (
          <span className="text-xs font-semibold"
                style={{ color: expired ? '#ef4444' : '#22c55e' }}>
            {v} {expired ? '(Expired)' : ''}
          </span>
        )
      },
    },
    {
      key: 'reason',
      label: t('reason'),
      render: (v) => (
        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {v || '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)' }}>
          {t('visitors')}
          <span className="text-sm font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>
            ({data.length})
          </span>
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#cc0000,#aa0000)' }}>
          <Plus size={15} /> {t('registerVisitor')}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchKeys={['first_name', 'last_name', 'digital_id', 'phone']}
        actions={(row) => (
          <>
            <button
              onClick={() => setViewItem(row)}
              className="p-1.5 rounded-lg"
              style={{ color: '#3b82f6' }}
              title="View">
              <Eye size={14} />
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="p-1.5 rounded-lg"
              style={{ color: '#ef4444' }}
              title="Delete">
              <Trash2 size={14} />
            </button>
          </>
        )}
      />

      {/* Register Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={t('registerVisitor')}
        width="max-w-3xl">
        <RegistrationForm
          type="visitor"
          onSubmit={handleCreate}
          onCancel={() => setShowAdd(false)}
          loading={saving}
        />
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Visitor Details">
        {viewItem && (
          <div className="space-y-3 text-sm">
            {viewItem.profile_image && (
              <img
                src={viewItem.profile_image}
                alt="profile"
                className="w-20 h-20 rounded-xl object-cover mb-2"
              />
            )}
            {[
              ['Name',       `${viewItem.first_name} ${viewItem.middle_name} ${viewItem.last_name}`],
              ['Digital ID', viewItem.digital_id],
              ['Phone',      viewItem.phone],
              ['Email',      viewItem.email],
              ['Reason',     viewItem.reason],
              ['Start Date', viewItem.date_of_first_entry],
              ['Expiry',     viewItem.date_of_expiry],
              ['Registered', viewItem.registered_at
                ? new Date(viewItem.registered_at).toLocaleString() : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <span className="w-28 flex-shrink-0 font-semibold"
                      style={{ color: 'var(--color-text-muted)' }}>
                  {label}
                </span>
                <span style={{ color: 'var(--color-text-main)' }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}