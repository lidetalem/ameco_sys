import React, { useState } from 'react'
import { Save, X } from 'lucide-react'
import CameraCapture from './CameraCapture'
import { useLang } from '../context/LanguageContext'

/**
 * RegistrationForm
 * Props:
 *  type        - 'admin' | 'guard' | 'staff' | 'visitor'
 *  onSubmit    - async (formData) => void
 *  onCancel    - () => void
 *  loading     - bool
 */
export default function RegistrationForm({ type, onSubmit, onCancel, loading = false }) {
  const { t } = useLang()

  const [form, setForm] = useState({
    first_name: '', middle_name: '', last_name: '',
    phone_number: '', email: '', gender: 'M',
    position: '', department: '', description: '',
    username: '', password: '',
    date_of_first_entry: '', date_of_expiry: '',
    reason: '',
    gate_camera_id: '', gates_assigned_to: '',
    profile_image_base64: '',
    face_scan_1_base64: '', face_scan_2_base64: '', face_scan_3_base64: '',
    face_scan_4_base64: '', face_scan_5_base64: '',
    id_card_front_base64: '', id_card_back_base64: '',
  })

  const set = (key) => (val) =>
    setForm((f) => ({ ...f, [key]: typeof val === 'object' && val?.target ? val.target.value : val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const needsAccount   = type === 'admin' || type === 'guard'
  const needsPosition  = type === 'staff'
  const needsDates     = type === 'visitor'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Basic Info ──────────────────────────────── */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: 'var(--color-ameco-red)' }}>
          Basic Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="field-label">{t('firstName')} *</label>
            <input className="ameco-input" value={form.first_name} onChange={set('first_name')} required />
          </div>
          <div>
            <label className="field-label">{t('middleName')}</label>
            <input className="ameco-input" value={form.middle_name} onChange={set('middle_name')} />
          </div>
          <div>
            <label className="field-label">{t('lastName')}</label>
            <input className="ameco-input" value={form.last_name} onChange={set('last_name')} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <div>
            <label className="field-label">{t('phone')}</label>
            <input className="ameco-input" value={form.phone_number} onChange={set('phone_number')} />
          </div>
          <div>
            <label className="field-label">{t('email')}</label>
            <input className="ameco-input" type="email" value={form.email} onChange={set('email')} />
          </div>
        </div>
        <div className="mt-3">
          <label className="field-label">{t('gender')}</label>
          <select className="ameco-input" value={form.gender} onChange={set('gender')}>
            <option value="M">{t('male')}</option>
            <option value="F">{t('female')}</option>
            <option value="O">{t('other')}</option>
          </select>
        </div>
      </section>

      {/* ── Position / Department (staff only) ──────── */}
      {needsPosition && (
        <section>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-ameco-red)' }}>
            Work Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t('position')}</label>
              <input className="ameco-input" value={form.position} onChange={set('position')} />
            </div>
            <div>
              <label className="field-label">{t('department')}</label>
              <input className="ameco-input" value={form.department} onChange={set('department')} />
            </div>
          </div>
        </section>
      )}

      {/* ── Visitor dates ────────────────────────────── */}
      {needsDates && (
        <section>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-ameco-red)' }}>
            Visit Period
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">{t('startDate')}</label>
              <input className="ameco-input" type="date" value={form.date_of_first_entry} onChange={set('date_of_first_entry')} />
            </div>
            <div>
              <label className="field-label">{t('endDate')} *</label>
              <input className="ameco-input" type="date" value={form.date_of_expiry} onChange={set('date_of_expiry')} required={type === 'visitor'} />
            </div>
          </div>
          <div className="mt-3">
            <label className="field-label">{t('reason')}</label>
            <textarea className="ameco-input" rows={2} value={form.reason} onChange={set('reason')} />
          </div>
        </section>
      )}

      {/* ── Account credentials (admin / guard) ─────── */}
      {needsAccount && (
        <section>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: 'var(--color-ameco-red)' }}>
            Account Credentials
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Username *</label>
              <input className="ameco-input" value={form.username} onChange={set('username')} required />
            </div>
            <div>
              <label className="field-label">Password *</label>
              <input className="ameco-input" type="password" value={form.password} onChange={set('password')} required />
            </div>
          </div>
        </section>
      )}

      {/* ── Description ──────────────────────────────── */}
      <div>
        <label className="field-label">{t('description')}</label>
        <textarea className="ameco-input" rows={2} value={form.description} onChange={set('description')} />
      </div>

      {/* ── Face Captures ────────────────────────────── */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: 'var(--color-ameco-red)' }}>
          {t('faceCapture')} (5 Angles)
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {[
            ['face_scan_1_base64', t('front')],
            ['face_scan_2_base64', t('left')],
            ['face_scan_3_base64', t('right')],
            ['face_scan_4_base64', t('down')],
            ['face_scan_5_base64', t('unusual')],
          ].map(([key, label]) => (
            <CameraCapture
              key={key}
              label={label}
              captured={!!form[key]}
              onCapture={set(key)}
            />
          ))}
        </div>
      </section>

      {/* ── Profile + ID captures ────────────────────── */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: 'var(--color-ameco-red)' }}>
          {t('profileImage')} & {t('idCapture')}
        </h4>
        <div className="flex flex-wrap gap-6 justify-center">
          <CameraCapture label={t('profileImage')} captured={!!form.profile_image_base64} onCapture={set('profile_image_base64')} />
          <CameraCapture label={t('idFront')} captured={!!form.id_card_front_base64} onCapture={set('id_card_front_base64')} />
          <CameraCapture label={t('idBack')} captured={!!form.id_card_back_base64} onCapture={set('id_card_back_base64')} />
        </div>
      </section>

      {/* ── Submit ────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: 'var(--color-border-main)' }}>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: 'var(--color-card-hover)',
            border: '1px solid var(--color-border-main)',
            color: 'var(--color-text-muted)',
          }}>
          <X size={14} /> {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: 'linear-gradient(135deg,#cc0000,#aa0000)',
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          {loading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Save size={14} />
          }
          {t('save')}
        </button>
      </div>

      <style>{`
        .field-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.375rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </form>
  )
}