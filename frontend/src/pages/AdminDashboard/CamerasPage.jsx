import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Power, Wrench, Scan } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import FaceScanOverlay from '../../components/FaceScanOverlay'
import { camerasAPI } from '../../services/api'
import { useLang } from '../../context/LanguageContext'

export default function CamerasPage() {
  const { t } = useLang()
  const [cameras, setCameras]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [scanCam, setScanCam]   = useState(null)
  const [form, setForm]         = useState({
    gate_name: '', camera_name: '', terminal_id: '',
    location: '', ip_address: '', installation_date: '',
  })

  const load = () => {
    setLoading(true)
    camerasAPI.list()
      .then((r) => setCameras(r.data.results || r.data))
      .catch(() => toast.error('Failed to load cameras'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await camerasAPI.create({ ...form, power: 'on', status: 'active' })
      toast.success('Camera added!')
      setShowAdd(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add camera')
    } finally {
      setSaving(false)
    }
  }

  const togglePower = async (id) => {
    try {
      await camerasAPI.togglePower(id)
      load()
    } catch { toast.error('Failed') }
  }

  const toggleStatus = async (id) => {
    try {
      await camerasAPI.toggleStatus(id)
      load()
    } catch { toast.error('Failed') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('confirmDelete'))) return
    try {
      await camerasAPI.delete(id)
      toast.success('Deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-main)' }}>
          {t('cameras')} <span className="text-sm font-normal ml-1" style={{ color: 'var(--color-text-muted)' }}>({cameras.length})</span>
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#cc0000,#aa0000)' }}>
          <Plus size={15} /> {t('addNew')}
        </button>
      </div>

      {/* Camera grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
               style={{ borderColor: 'var(--color-ameco-red)', borderTopColor: 'transparent' }} />
        </div>
      ) : cameras.length === 0 ? (
        <p className="text-center py-16 text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('noData')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((cam) => (
            <div
              key={cam.id}
              className="rounded-2xl p-5 space-y-4"
              style={{
                background: 'var(--color-card-main)',
                border: `1px solid ${cam.status === 'active' && cam.power === 'on'
                  ? 'rgba(34,197,94,0.3)' : 'var(--color-border-main)'}`,
              }}>

              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--color-text-main)' }}>
                    {cam.gate_name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {cam.camera_name} · {cam.terminal_id}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${cam.power === 'on' && cam.status === 'active' ? 'status-dot-live' : ''}`}
                    style={{ background: cam.power === 'on' && cam.status === 'active' ? '#22c55e' : '#6b7280' }}
                  />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {cam.power === 'on' && cam.status === 'active' ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {cam.location && <p>📍 {cam.location}</p>}
                {cam.ip_address && <p>🌐 {cam.ip_address}</p>}
              </div>

              {/* Badges */}
              <div className="flex gap-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: cam.power === 'on' ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                    color:      cam.power === 'on' ? '#22c55e' : '#6b7280',
                  }}>
                  {t('power')}: {cam.power === 'on' ? t('on') : t('off')}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: cam.status === 'active' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                    color:      cam.status === 'active' ? '#3b82f6' : '#f59e0b',
                  }}>
                  {cam.status === 'active' ? t('active') : t('maintenance')}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border-main)' }}>
                <button
                  onClick={() => setScanCam(cam.terminal_id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#cc0000,#aa0000)' }}>
                  <Scan size={12} /> {t('scanFace')}
                </button>
                <button
                  onClick={() => togglePower(cam.id)}
                  className="p-1.5 rounded-xl transition-all"
                  title="Toggle Power"
                  style={{
                    background: cam.power === 'on' ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)',
                    color:      cam.power === 'on' ? '#22c55e' : '#6b7280',
                    border:     '1px solid var(--color-border-main)',
                  }}>
                  <Power size={14} />
                </button>
                <button
                  onClick={() => toggleStatus(cam.id)}
                  className="p-1.5 rounded-xl transition-all"
                  title="Toggle Maintenance"
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    color: '#f59e0b',
                    border: '1px solid var(--color-border-main)',
                  }}>
                  <Wrench size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cam.id)}
                  className="p-1.5 rounded-xl transition-all"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid var(--color-border-main)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Camera Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Gate Camera" width="max-w-md">
        <form onSubmit={handleCreate} className="space-y-4">
          {[
            ['gate_name',   t('gateName')],
            ['camera_name', t('cameraName')],
            ['terminal_id', t('terminalId')],
            ['location',    'Location'],
            ['ip_address',  'IP Address'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                     style={{ color: 'var(--color-text-muted)' }}>{label}</label>
              <input className="ameco-input" value={form[key]} onChange={setF(key)}
                     required={['gate_name','camera_name','terminal_id'].includes(key)} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                   style={{ color: 'var(--color-text-muted)' }}>Installation Date</label>
            <input className="ameco-input" type="date" value={form.installation_date} onChange={setF('installation_date')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAdd(false)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: 'var(--color-card-hover)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-main)' }}>
              {t('cancel')}
            </button>
            <button type="submit" disabled={saving}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#cc0000,#aa0000)', opacity: saving ? 0.6 : 1 }}>
              {saving ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Face Scan Overlay */}
      {scanCam && <FaceScanOverlay cameraId={scanCam} onClose={() => setScanCam(null)} />}
    </div>
  )
}