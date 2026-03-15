import { useState } from 'react'
import doupiAvatar from '../assets/doupiAvatar'
import { isConfigured } from '../lib/supabase'

export default function SettingsPage({ profile, onUpdate }) {
  const [name, setName] = useState(profile.name || '豆皮')
  const [saved, setSaved] = useState(false)

  const saveName = async () => {
    await onUpdate({ name })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div style={{ padding: '0 14px 14px' }}>
      <div style={{ padding: '12px 0 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 16px' }}>⚙️ 設定</h1>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            overflow: 'hidden', border: '3px solid white',
            boxShadow: '0 2px 16px rgba(230,122,45,0.25)', marginBottom: 8,
          }}>
            <img src={doupiAvatar} alt="豆皮" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--brown-l)' }}>🐱 豆皮</div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 8 }}>貓咪名字</div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              border: '1.5px solid var(--surface)', background: 'var(--cream)',
              fontSize: 18, fontWeight: 800, color: 'var(--text)',
            }}
          />
        </div>

        <button onClick={saveName} style={{
          width: '100%', padding: 14, borderRadius: 14,
          background: saved ? '#6DB56A' : 'var(--orange-d)',
          color: 'white', border: 'none', fontSize: 15, fontWeight: 800,
          cursor: 'pointer', transition: 'background .3s',
        }}>{saved ? '✓ 已儲存！' : '儲存設定'}</button>
      </div>

      {!isConfigured() && (
        <div style={{ background: '#FFF8E0', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8A6A00', marginBottom: 6 }}>⚙️ 尚未連接 Supabase</div>
          <div style={{ fontSize: 12, color: '#6A5000', lineHeight: 1.6 }}>
            在 Netlify 環境變數填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 後重新部署，資料就會同步到所有家人的手機。
          </div>
        </div>
      )}
    </div>
  )
}
