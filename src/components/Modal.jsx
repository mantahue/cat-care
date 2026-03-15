import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="modal-in"
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--cream)',
          borderRadius: 24,
          maxHeight: '90dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 12px 20px',
          borderBottom: '0.5px solid rgba(122,79,45,0.12)',
          flexShrink: 0,
          background: 'var(--cream)',
          borderRadius: '24px 24px 0 0',
        }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', flex: 1, paddingRight: 8 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface)',
              border: 'none',
              borderRadius: '50%',
              width: 34, height: 34, minWidth: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-s)', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 24px' }} className="scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  )
}
