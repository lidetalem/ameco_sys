import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import RegistrationForm from '../../components/RegistrationForm'
import { guardsAPI } from '../../services/api'
import { useLang } from '../../context/LanguageContext'

export default function GuardsPage() {
  const { t } = useLang()
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [viewItem, setViewItem] = useState(null)

  const load = () => {
    setLoading(true)
    guardsAPI.list()
      .then((r) => setData(r.data.results || r.data))
      .catch(() => toast.error('Failed to load guards'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (form) => {
    setSaving(true)
    try {
      await guardsAPI.create({ ...form, role: 'guard', registered_by: 'admin' })
      toast.success('Guard registered!')
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
      await guardsAPI.delete(id)
      toast.success('Deleted')
      load()
    } catch {
      toast.error('Delete failed')
    }
  }

  const columns = [
    {
      key: 'first_name',
      label: 'Name',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-sm">{row.first_name} {row.middle_name} {row.last_name}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{row.digital_id}</p>
        </div>
      ),
    },
    { key: 'username',     label: 'Username' },
    { key: 'phone_number', label: t('phone') },
    { key: 'guard_tag',    label: t('tag') },
    {
      key: 'gates_assigned_to',
      label: t('assignedGate'),
      render: (v) => v || '—',
    },
    {
      key: 'registered_at',
      label: 'Registered',
      render: (v) => v ? new Date(v).toLocaleDateString() : '—',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)' }}>
          {t('guards')} <span className="text-sm font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>({data.length})</span>
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#cc0000,#aa0000)' }}>
          <Plus size={15} /> {t('addNew')}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        searchKeys={['first_name', 'last_name', 'username', 'digital_id']}
        actions={(row) => (
          <>
            <button onClick={() => setViewItem(row)} className="p-1.5 rounded-lg" style={{ color: '#3b82f6' }}><Eye size={14} /></button>
            <button onClick={() => handleDelete(row.id)} className="p-1.5 rounded-lg" style={{ color: '#ef4444' }}><Trash2 size={14} /></button>
          </>
        )}
      />

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('registerGuard')} width="max-w-3xl">
        <RegistrationForm type="guard" onSubmit={handleCreate} onCancel={() => setShowAdd(false)} loading={saving} />
      </Modal>

      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title="Guard Details">
        {viewItem && (
          <div className="space-y-3 text-sm">
            {[
              ['Name', `${viewItem.first_name} ${viewItem.middle_name} ${viewItem.last_name}`],
              ['Username', viewItem.username],
              ['Digital ID', viewItem.digital_id],
              ['Phone', viewItem.phone_number],
              ['Guard Tag', viewItem.guard_tag],
              ['Gates Assigned', viewItem.gates_assigned_to],
              ['Registered At', viewItem.registered_at ? new Date(viewItem.registered_at).toLocaleString() : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-3">
                <span className="w-36 flex-shrink-0 font-semibold" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--color-text-main)' }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}