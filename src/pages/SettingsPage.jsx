import { useState, useRef } from 'react'
import { Camera } from 'lucide-react'
import { supabase, isConfigured } from '../lib/supabase'

export default function SettingsPage({ profile, onUpdate }) {
  const [name, setName] = useState(profile.name || '豆皮')
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef()

  const saveName = async () => {
    await onUpdate({ name })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isConfigured()) {
      const url = URL.createObjectURL(file)
      await onUpdate({ avatar_url: url })
      return
    }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatar/cat.${ext}`
    await supabase.storage.from('cat-photos').upload(path, file, { upsert: true })
    const { data } = supabase.storage.from('cat-photos').getPublicUrl(path)
    await onUpdate({ avatar_url: data.publicUrl + '?t=' + Date.now() })
    setUploading(false)
  }

  return (
    <div style={{ padding: '0 14px 14px' }}>
      <div style={{ padding: '0 0 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)', marginBottom: 16 }}>貓咪設定</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'var(--orange)', overflow: 'hidden',
              border: '3px solid white', boxShadow: '0 2px 12px rgba(230,122,45,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 40 }}>🐱</span>
              }
            </div>
            <button onClick={() => fileRef.current?.click()} style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--orange-d)', border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
            }}>
              <Camera size={13} />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} style={{ display: 'none' }} />
          <div style={{ fontSize: 12, color: 'var(--brown-l)' }}>{uploading ? '上傳中…' : '點擊相機圖示更換照片'}</div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>貓咪名字</div>
          <input value={name} onChange={e => setName(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }} />
        </div>
        <button onClick={saveName} style={{
          width: '100%', padding: 13, borderRadius: 14,
          background: saved ? '#6DB56A' : 'var(--orange-d)',
          color: 'white', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer',
          transition: 'background .3s',
        }}>{saved ? '✓ 已儲存！' : '儲存設定'}</button>
      </div>
      {!isConfigured() && (
        <div style={{ background: '#FFF8E0', borderRadius: 14, padding: 14, marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#8A6A00', marginBottom: 6 }}>⚙️ 連接 Supabase 以同步資料</div>
          <div style={{ fontSize: 12, color: '#6A5000', lineHeight: 1.6 }}>
            在 Netlify 環境變數填入：<br />
            <code style={{ fontSize: 11, display: 'block', marginTop: 6, background: '#FFE', padding: '6px 8px', borderRadius: 8, lineHeight: 1.8 }}>
              VITE_SUPABASE_URL=你的URL<br />
              VITE_SUPABASE_ANON_KEY=你的Key
            </code>
          </div>
        </div>
      )}
    </div>
  )
}
