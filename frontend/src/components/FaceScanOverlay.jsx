import React, { useRef, useState, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Scan, X, CheckCircle, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react'
import { recognitionAPI } from '../services/api'
import { useLang } from '../context/LanguageContext'

const RESULT_COLORS = {
  ACCEPTED:             '#22c55e',
  REJECTED:             '#ef4444',
  SPOOF_DETECTED:       '#f59e0b',
  ATTEMPT_LIMIT_REACHED:'#7c3aed',
  ERROR:                '#ef4444',
}

const RESULT_ICONS = {
  ACCEPTED:             CheckCircle,
  REJECTED:             XCircle,
  SPOOF_DETECTED:       AlertTriangle,
  ATTEMPT_LIMIT_REACHED:ShieldAlert,
}

export default function FaceScanOverlay({ cameraId, onClose }) {
  const { t }       = useLang()
  const webcamRef   = useRef(null)
  const intervalRef = useRef(null)

  const [scanning, setScanning]   = useState(false)
  const [result, setResult]       = useState(null)
  const [person, setPerson]       = useState(null)
  const [scanLine, setScanLine]   = useState(false)

  const doScan = useCallback(async () => {
    if (scanning) return
    const image = webcamRef.current?.getScreenshot()
    if (!image) return

    setScanning(true)
    setScanLine(true)
    try {
      const { data } = await recognitionAPI.scan({ image, camera_id: cameraId })
      setResult(data.result)
      if (data.result === 'ACCEPTED') {
        setPerson(data)
        clearInterval(intervalRef.current)
      }
    } catch (err) {
      setResult('ERROR')
    } finally {
      setScanning(false)
      setScanLine(false)
    }
  }, [scanning, cameraId])

  // Auto-scan every 1.5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(doScan, 1500)
    return () => clearInterval(intervalRef.current)
  }, [doScan])

  // Auto-clear result after 4 seconds and resume scanning
  useEffect(() => {
    if (result && result !== 'ATTEMPT_LIMIT_REACHED') {
      const timer = setTimeout(() => {
        setResult(null)
        setPerson(null)
        intervalRef.current = setInterval(doScan, 1500)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [result, doScan])

  const ResultIcon = result ? (RESULT_ICONS[result] || XCircle) : null
  const resultColor = result ? RESULT_COLORS[result] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>

      <div className="relative w-full max-w-sm mx-4">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
          <X size={16} />
        </button>

        {/* Camera frame */}
        <div className="relative rounded-2xl overflow-hidden aspect-square"
             style={{
               border: `3px solid ${resultColor || (scanning ? 'var(--color-ameco-red)' : 'rgba(255,255,255,0.2)')}`,
               boxShadow: resultColor ? `0 0 30px ${resultColor}66` : scanning ? '0 0 30px rgba(204,0,0,0.5)' : 'none',
               transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
             }}>

          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.85}
            videoConstraints={{ facingMode: 'user', width: 400, height: 400 }}
            className="w-full h-full object-cover"
          />

          {/* Scan line animation */}
          {scanLine && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute left-0 right-0 h-0.5 animate-scan-line"
                style={{ background: 'linear-gradient(90deg, transparent, #cc0000, transparent)' }}
              />
            </div>
          )}

          {/* Corner brackets */}
          {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} w-6 h-6`}
              style={{
                borderTop: i < 2 ? '3px solid #cc0000' : 'none',
                borderBottom: i >= 2 ? '3px solid #cc0000' : 'none',
                borderLeft: i % 2 === 0 ? '3px solid #cc0000' : 'none',
                borderRight: i % 2 === 1 ? '3px solid #cc0000' : 'none',
              }}
            />
          ))}

          {/* Result overlay */}
          {result && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ background: `${resultColor}22` }}>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
                style={{ background: `${resultColor}33`, border: `3px solid ${resultColor}` }}>
                {ResultIcon && <ResultIcon size={40} style={{ color: resultColor }} />}
              </div>
              <p className="text-xl font-black" style={{ color: resultColor }}>
                {t(result === 'ACCEPTED' ? 'accepted'
                  : result === 'REJECTED' ? 'rejected'
                  : result === 'SPOOF_DETECTED' ? 'spoofDetected'
                  : 'attemptLimit'
                )}
              </p>
            </div>
          )}
        </div>

        {/* Person info card */}
        {person && result === 'ACCEPTED' && (
          <div
            className="mt-4 rounded-2xl p-4 flex items-center gap-4"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.4)',
            }}>
            {person.profile_image && (
              <img
                src={person.profile_image}
                alt={person.name}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
            )}
            <div>
              <p className="font-bold text-white">{person.name}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {person.role} · {person.digital_id}
              </p>
              {person.position && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {person.position}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: '#22c55e' }}>
                Confidence: {person.confidence}%
              </p>
            </div>
          </div>
        )}

        {/* Status label */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {scanning ? (
            <>
              <div className="w-3 h-3 rounded-full status-dot-live" style={{ background: '#cc0000' }} />
              <span className="text-sm text-white/60">{t('processing')}</span>
            </>
          ) : (
            <>
              <Scan size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {t('scanFace')} · {cameraId}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}