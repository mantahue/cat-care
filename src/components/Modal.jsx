import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end',
    }}>
      <div onClick={e => e.stopPropagation()} className="modal-in" style={{
        width: '100%', maxWidth: 430, margin: '0 auto',
        background: 'var(--cream)', borderRadius: '24px 24px 0 0',
        maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 12px',
          borderBottom: '0.5px solid rgba(122,79,45,0.1)',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>{title}</span>
          <button onClick={onClose} style={{
            background: 'var(--surface)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-s)',
          }}><X size={16} /></button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px 20px' }} className="scrollbar-hide">
          {children}
        </div>
      </div>
    </div>
  )
}
