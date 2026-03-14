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

    const localUrl = URL.createObjectURL(file)
    await onUpdate({ avatar_url: localUrl })

    if (!isConfigured()) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = `avatar/cat-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('cat-photos')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from('cat-photos').getPublicUrl(path)
      const publicUrl = data.publicUrl + '?t=' + Date.now()
      await onUpdate({ avatar_url: publicUrl })
    } catch (err) {
      console.error('Avatar upload failed:', err)
    }
    setUploading(false)
  }

  return (
    <div style={{ padding: '0 14px 14px' }}>
      <div style={{ padding: '12px 0 16px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: '0 0 16px' }}>⚙️ 設定</h1>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'var(--orange)', overflow: 'hidden',
              border: '3px solid white', boxShadow: '0 2px 16px rgba(230,122,45,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {profile.avatar_url
                ? <img
                    src={profile.avatar_url}
                    alt="貓咪頭像"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                : null
              }
              {!profile.avatar_url && <span style={{ fontSize: 44 }}>🐱</span>}
            </div>
            <button onClick={() => fileRef.current?.click()} style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--orange-d)', border: '2.5px solid white',
              display
