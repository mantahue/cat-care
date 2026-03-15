import { useState } from 'react'
import { Home, Stethoscope, UtensilsCrossed, ClipboardList, Search, Settings } from 'lucide-react'
import { useCatProfile } from './hooks/useSupabase'
import doupiAvatar from './assets/doupiAvatar'

import HomePage from './pages/HomePage'
import MedicalPage from './pages/MedicalPage'
import FoodPage from './pages/FoodPage'
import RoutinePage from './pages/RoutinePage'
import SearchPage from './pages/SearchPage'
import SettingsPage from './pages/SettingsPage'
import HealthPage from './pages/HealthPage'

const TABS = [
  { id: 'home', label: '今日', Icon: Home },
  { id: 'medical', label: '醫療', Icon: Stethoscope },
  { id: 'food', label: '飲食', Icon: UtensilsCrossed },
  { id: 'routine', label: '例行', Icon: ClipboardList },
  { id: 'search', label: '搜尋', Icon: Search },
]

export default function App() {
  const [tab, setTab] = useState('home')
  const { profile, update } = useCatProfile()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px 0', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            overflow: 'hidden', border: '2.5px solid white',
            boxShadow: '0 2px 8px rgba(230,122,45,0.25)',
            flexShrink: 0, cursor: 'pointer',
          }} onClick={() => setTab('settings')}>
            <img src={doupiAvatar} alt="豆皮" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{profile.name}</div>
            <div style={{ fontSize: 10, color: 'var(--brown-l)', fontWeight: 600 }}>的照護日誌</div>
          </div>
        </div>
        <button onClick={() => setTab(tab === 'settings' ? 'home' : 'settings')} style={{
          background: tab === 'settings' ? 'var(--orange-d)' : 'var(--surface)',
          border: 'none', borderRadius: '50%', width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: tab === 'settings' ? 'white' : 'var(--text-s)',
        }}>
          <Settings size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-hide">
        {tab === 'home' && <HomePage catName={profile.name} />}
        {tab === 'medical' && (
          <div>
            <MedicalPage />
            <div style={{ padding: '0 14px' }}><HealthPage /></div>
          </div>
        )}
        {tab === 'food' && <FoodPage />}
        {tab === 'routine' && <RoutinePage />}
        {tab === 'search' && <SearchPage />}
        {tab === 'settings' && <SettingsPage profile={profile} onUpdate={update} />}
      </div>

      <nav style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, background: 'white',
        borderTop: '0.5px solid rgba(122,79,45,0.12)',
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom, 0px)', zIndex: 100,
      }}>
        {TABS.map(({ id, label, Icon }) => {
          const on = tab === id
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '10px 0 8px', border: 'none', background: 'none',
              cursor: 'pointer', color: on ? 'var(--orange-d)' : 'var(--text-s)', transition: 'color .15s',
            }}>
              <Icon size={20} strokeWidth={on ? 2.5 : 1.8} />
              <span style={{ fontSize: 10, fontWeight: on ? 800 : 600 }}>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
