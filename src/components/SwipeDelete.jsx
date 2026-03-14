import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'

export default function SwipeDelete({ onDelete, children }) {
  const startX = useRef(null)
  const [offset, setOffset] = useState(0)
  const [deleting, setDeleting] = useState(false)

  const THRESHOLD = 72

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX }
  const onTouchMove = (e) => {
    if (startX.current === null) return
    const dx = startX.current - e.touches[0].clientX
    if (dx > 0) setOffset(Math.min(dx, THRESHOLD + 16))
  }
  const onTouchEnd = () => {
    if (offset > THRESHOLD / 2) setOffset(THRESHOLD)
    else setOffset(0)
    startX.current = null
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete()
  }

  if (deleting) return null

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: THRESHOLD,
        background: 'var(--red)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', borderRadius: '0 12px 12px 0',
      }}>
        <button onClick={handleDelete} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'white', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 2,
        }}>
          <Trash2 size={18} />
          <span style={{ fontSize: 10, fontWeight: 700 }}>刪除</span>
        </button>
      </div>
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(-${offset}px)`,
          transition: startX.current === null ? 'transform .2s ease' : 'none',
          background: 'var(--cream)',
          position: 'relative', zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  )
}
