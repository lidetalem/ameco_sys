import React, { useEffect, useState } from 'react'
import { Scan, UserCheck, Clock, CheckCircle, XCircle } from 'lucide-react'
import StatCard from '../../components/StatCard'
import FaceScanOverlay from '../../components/FaceScanOverlay'
import { visitorsAPI, requestsAPI, camerasAPI } from '../../services/api'
import { useLang } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

export default function GuardOverview() {
  const { t }    = useLang()
  const { user } = useAuth()

  const [cameras, setCameras]   = useState([])
  const [visitors, setVisitors] = useState([])
  const [requests, setRequests] = useState([])
  const [scanCam, setScanCam]   = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([camerasAPI.list(), visitorsAPI.list(), requestsAPI.list()])
      .then(([c, v, r]) => {
        setCameras(c.data.results || c.data)
        setVisitors(v.data.results || v.data)
        setRequests(r.data.results || r.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const activeCameras  = cameras.filter((c) => c.power === 'on' && c.status === 'active')
  const pendingReqs    = requests.filter((r) => r.status === 'PENDING')
  const approvedReqs   = requests.filter((r) => r.status === 'APPROVED')

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <div className="rounded-2xl px-6 py-5 flex items-center justify-between"
           style={{
             background: 'linear-gradient(135deg, rgba(204,0,0,0.15), rgba(136,0,0,0.05))',
             border: '1px solid rgba(204,0,0,0.2)',
           }}>
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('welcome')},</p>
          <h2 className="text-2xl font-black mt-0.5" style={{ color: 'var(--color-text-main)' }}>
            {user?.full_name || user?.username}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ameco-red)' }}>
            Security Guard · AMECO
          </p>
        </div>

        {/* Quick scan button */}
        {activeCameras.length > 0 && (
          <button
            onClick={() => setScanCam(activeCameras[0].terminal_id)}
            className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl text-white transition-all"
            style={{
              background: 'linear-gradient(135deg,#cc0000,#880000)',
              boxShadow: '0 8px 24px rgba(204,0,0,0.4)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            <Scan size={28} className="animate-heartbeat" />
            <span className="text-xs font-bold uppercase tracking-wider">{t('scanFace')}</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserCheck}   label={t('totalVisitors')}  value={visitors.length}     color="#f59e0b" />
        <StatCard icon={Clock}       label={t('pending')}        value={pendingReqs.length}  color="#f59e0b" />
        <StatCard icon={CheckCircle} label={t('approved')}       value={approvedReqs.length} color="#22c55e" />
        <StatCard icon={Scan}        label="Active Cameras"      value={activeCameras.length} color="#cc0000" />
      </div>

      {/* Active cameras */}
      {activeCameras.length > 0 && (
        <div>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-main)' }}>
            Active Gate Cameras
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeCameras.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setScanCam(cam.terminal_id)}
                className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all group"
                style={{
                  background: 'var(--color-card-main)',
                  border: '1px solid rgba(34,197,94,0.25)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(204,0,0,0.5)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.25)'}>

                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(204,0,0,0.15)' }}>
                  <Scan size={18} style={{ color: '#cc0000' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-text-main)' }}>
                    {cam.gate_name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {cam.terminal_id}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full status-dot-live" style={{ background: '#22c55e' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pending requests callout */}
      {pendingReqs.length > 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3"
             style={{
               background: 'rgba(245,158,11,0.1)',
               border: '1px solid rgba(245,158,11,0.3)',
             }}>
          <Clock size={20} style={{ color: '#f59e0b' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-main)' }}>
            You have <span className="font-bold" style={{ color: '#f59e0b' }}>
              {pendingReqs.length} pending
            </span> visitor request{pendingReqs.length !== 1 ? 's' : ''} awaiting admin approval.
          </p>
        </div>
      )}

      {/* Face Scan Overlay */}
      {scanCam && <FaceScanOverlay cameraId={scanCam} onClose={() => setScanCam(null)} />}
    </div>
  )
}