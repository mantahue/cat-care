import { useState, useEffect } from 'react'
import { Plus, Send, Trash2, Droplets, Wind } from 'lucide-react'
import Modal from '../components/Modal'
import StarRating from '../components/StarRating'
import SwipeDelete from '../components/SwipeDelete'
import { supabase, isConfigured } from '../lib/supabase'
import { format } from 'date-fns'

const today = format(new Date(), 'yyyy-MM-dd')

const DEMO_MEALS = [
  { id: '1', fed_at: new Date().toISOString().replace(/T.*/, 'T07:30:00Z'), food_desc: '飼料一盤', appetite: 4, note: '' },
  { id: '2', fed_at: new Date().toISOString().replace(/T.*/, 'T12:00:00Z'), food_desc: '罐頭半罐', appetite: 5, note: '' },
]
const DEMO_TOILET = [
  { id: '1', type: 'pee', status: null, logged_at: new Date().toISOString().replace(/T.*/, 'T08:10:00Z'), note: '' },
  { id: '2', type: 'poop', status: '正常', logged_at: new Date().toISOString().replace(/T.*/, 'T09:20:00Z'), note: '' },
]
const DEMO_MSGS = [
  { id: '1', author: '媽媽', content: '今天豆皮跑去廁所好幾次，幫忙注意！', created_at: new Date().toISOString() },
]
const DEMO_REMINDERS = [
  { task_name: '驅蟲', days: 32, color: '#E85D4A' },
  { task_name: '剪指甲', days: 28, color: '#FF8C42' },
]

const POOP_OPTS = [
  { v: '正常', emoji: '✅' },
  { v: '軟便', emoji: '⚠️' },
  { v: '拉肚子', emoji: '🚨' },
  { v: '便秘乾硬', emoji: '🪨' },
]

export default function HomePage({ catName }) {
  const configured = isConfigured()
  const [meals, setMeals] = useState(configured ? [] : DEMO_MEALS)
  const [toilet, setToilet] = useState(configured ? [] : DEMO_TOILET)
  const [waterCount, setWaterCount] = useState(0)
  const [waterNote, setWaterNote] = useState('')
  const [messages, setMessages] = useState(configured ? [] : DEMO_MSGS)
  const [reminders, setReminders] = useState(DEMO_REMINDERS)

  const [feedModal, setFeedModal] = useState(false)
  const [feedTime, setFeedTime] = useState('')
  const [feedDesc, setFeedDesc] = useState('')
  const [feedAppetite, setFeedAppetite] = useState(0)
  const [feedNote, setFeedNote] = useState('')
  const [viewMeal, setViewMeal] = useState(null)

  const [toiletModal, setToiletModal] = useState(false)
  const [toiletType, setToiletType] = useState('pee')
  const [toiletTime, setToiletTime] = useState('')
  const [poopStatus, setPoopStatus] = useState('正常')
  const [toiletNote, setToiletNote] = useState('')
  const [viewToilet, setViewToilet] = useState(null)

  const [msgText, setMsgText] = useState('')
  const [msgAuthor, setMsgAuthor] = useState('')

  useEffect(() => {
    if (!configured) return
    loadMeals(); loadToilet(); loadMessages(); loadReminders(); loadWater()
  }, [])

  const loadMeals = async () => {
    const { data } = await supabase.from('feeding_logs')
      .select('*').gte('fed_at', today + 'T00:00:00').order('fed_at', { ascending: true })
    setMeals(data || [])
  }
  const loadToilet = async () => {
    const { data } = await supabase.from('toilet_logs')
      .select('*').gte('logged_at', today + 'T00:00:00').order('logged_at', { ascending: true })
    setToilet(data || [])
  }
  const loadWater = async () => {
    const { data } = await supabase.from('daily_logs').select('*').eq('log_date', today).single()
    if (data) { setWaterCount(data.water_cc ?? 0); setWaterNote(data.water_note ?? '') }
  }
  const loadMessages = async () => {
    const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(10)
    setMessages(data || [])
  }
  const loadReminders = async () => {
    const { data } = await supabase.from('routine_tasks').select('*').in('frequency', ['monthly', 'yearly'])
    if (!data) return
    const now = new Date()
    const items = data.map(t => {
      const days = t.last_done ? Math.floor((now - new Date(t.last_done)) / 86400000) : 999
      const th = t.frequency === 'yearly' ? 365 : 30
      return { ...t, days, overdue: days >= th }
    }).filter(t => t.overdue || t.days > 20)
    setReminders(items.map(t => ({
      task_name: t.task_name, days: t.days,
      color: t.days >= (t.frequency === 'yearly' ? 365 : 30) ? '#E85D4A' : '#FF8C42',
    })))
  }

  const openFeedModal = () => {
    const now = new Date()
    setFeedTime(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16))
    setFeedDesc(''); setFeedAppetite(0); setFeedNote('')
    setFeedModal(true)
  }
  const saveMeal = async () => {
    if (!feedDesc.trim()) return
    const entry = { fed_at: new Date(feedTime).toISOString(), food_desc: feedDesc, appetite: feedAppetite || null, note: feedNote || null }
    if (configured) { await supabase.from('feeding_logs').insert(entry); loadMeals() }
    else setMeals(m => [...m, { ...entry, id: Date.now().toString() }])
    setFeedModal(false)
  }
  const deleteMeal = async (id) => {
    if (configured) await supabase.from('feeding_logs').delete().eq('id', id)
    setMeals(m => m.filter(x => x.id !== id))
  }

  const openToiletModal = (type) => {
    const now = new Date()
    setToiletTime(new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16))
    setToiletType(type); setPoopStatus('正常'); setToiletNote('')
    setToiletModal(true)
  }
  const saveToilet = async () => {
    const entry = { type: toiletType, status: toiletType === 'poop' ? poopStatus : null, logged_at: new Date(toiletTime).toISOString(), note: toiletNote || null }
    if (configured) { await supabase.from('toilet_logs').insert(entry); loadToilet() }
    else setToilet(t => [...t, { ...entry, id: Date.now().toString() }])
    setToiletModal(false)
  }
  const deleteToilet = async (id) => {
    if (configured) await supabase.from('toilet_logs').delete().eq('id', id)
    setToilet(t => t.filter(x => x.id !== id))
  }

  const saveWater = async (count, note) => {
    if (!configured) return
    await supabase.from('daily_logs').upsert(
      { log_date: today, water_cc: count, water_note: note || null },
      { onConflict: 'log_date' }
    )
  }

  const sendMessage = async () => {
    if (!msgText.trim()) return
    const entry = { author: msgAuthor.trim() || '家人', content: msgText.trim() }
    if (configured) { await supabase.from('messages').insert(entry); loadMessages() }
    else setMessages(m => [{ ...entry, id: Date.now().toString(), created_at: new Date().toISOString() }, ...m])
    setMsgText(''); setMsgAuthor('')
  }
  const deleteMessage = async (id) => {
    if (configured) await supabase.from('messages').delete().eq('id', id)
    setMessages(m => m.filter(x => x.id !== id))
  }

  const peeToday = toilet.filter(t => t.type === 'pee')
  const poopToday = toilet.filter(t => t.type === 'poop')

  const poopColor = (s) => {
    if (!s || s === '正常') return { bg: '#E8F5E8', text: '#3A7A37' }
    if (s === '軟便') return { bg: '#FFF0E0', text: '#C0682A' }
    return { bg: '#FDECEA', text: '#C0392B' }
  }

  return (
    <div className="pb-nav fade-in" style={{ padding: '0 14px 14px' }}>

      <div style={{ padding: '12px 0 10px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>今日狀況</h1>
        <p style={{ fontSize: 12, color: 'var(--brown-l)', margin: '2px 0 0' }}>
          {format(new Date(), 'yyyy年M月d日')}（{['日','一','二','三','四','五','六'][new Date().getDay()]}）
        </p>
      </div>

      {/* Feeding */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)' }}>🍚 今日餵食</span>
          <button onClick={openFeedModal} className="btn-press" style={{ background: 'var(--orange-d)', color: 'white', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={13} /> 記錄餐點
          </button>
        </div>
        {meals.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--brown-l)', fontSize: 13, padding: '10px 0' }}>今天還沒有餵食紀錄</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              {meals.map((m, i) => (
                <button key={m.id} onClick={() => setViewMeal(m)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13, boxShadow: '0 2px 6px rgba(230,122,45,0.3)' }}>{i + 1}</div>
                  <span style={{ fontSize: 10, color: 'var(--text-s)', fontWeight: 600 }}>{format(new Date(m.fed_at), 'H:mm')}</span>
                </button>
              ))}
              <span style={{ fontSize: 12, color: 'var(--brown-l)', fontWeight: 600 }}>共 {meals.length} 餐</span>
            </div>
            {meals.map(m => (
              <SwipeDelete key={m.id} onDelete={() => deleteMeal(m.id)}>
                <div onClick={() => setViewMeal(m)} style={{ padding: '8px 4px', borderBottom: '0.5px solid var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{m.food_desc}</span>
                    {m.note && <div style={{ fontSize: 11, color: 'var(--text-s)' }}>{m.note}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {m.appetite > 0 && <span style={{ fontSize: 11 }}>{'⭐'.repeat(m.appetite)}</span>}
                    <span style={{ fontSize: 11, color: 'var(--brown-l)' }}>{format(new Date(m.fed_at), 'H:mm')}</span>
                  </div>
                </div>
              </SwipeDelete>
            ))}
          </>
        )}
      </div>

      {/* Toilet */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)', marginBottom: 12 }}>🚽 今日上廁所</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <button onClick={() => openToiletModal('pee')} className="btn-press" style={{ padding: '14px 10px', borderRadius: 14, border: 'none', cursor: 'pointer', background: '#E8F3F8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Droplets size={24} color="#6BA3BE" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3A6B8A' }}>記錄尿尿</span>
            <span style={{ background: '#6BA3BE', color: 'white', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 800 }}>今日 {peeToday.length} 次</span>
          </button>
          <button onClick={() => openToiletModal('poop')} className="btn-press" style={{ padding: '14px 10px', borderRadius: 14, border: 'none', cursor: 'pointer', background: '#FFF0E0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <Wind size={24} color="#C07840" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#8A5020' }}>記錄便便</span>
            <span style={{ background: '#C07840', color: 'white', borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 800 }}>今日 {poopToday.length} 次</span>
          </button>
        </div>
        {toilet.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brown-l)', marginBottom: 6 }}>今日紀錄</div>
            {toilet.map(t => {
              const isPee = t.type === 'pee'
              const c = isPee ? { bg: '#E8F3F8', text: '#3A6B8A' } : poopColor(t.status)
              return (
                <SwipeDelete key={t.id} onDelete={() => deleteToilet(t.id)}>
                  <div onClick={() => setViewToilet(t)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '0.5px solid var(--surface)', cursor: 'pointer' }}>
                    <span style={{ background: c.bg, color: c.text, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {isPee ? '💧 尿尿' : `💩 ${t.status || '便便'}`}
                    </span>
                    {t.note && <span style={{ fontSize: 11, color: 'var(--text-s)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.note}</span>}
                    <span style={{ fontSize: 11, color: 'var(--brown-l)', marginLeft: 'auto', flexShrink: 0 }}>{format(new Date(t.logged_at), 'H:mm')}</span>
                  </div>
                </SwipeDelete>
              )
            })}
          </div>
        )}
      </div>

      {/* Water */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)', marginBottom: 12 }}>💧 喝水紀錄</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
          <button
            onClick={() => { const n = Math.max(0, waterCount - 1); setWaterCount(n); saveWater(n, waterNote) }}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface)', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-s)', fontWeight: 700 }}>−</button>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--orange-d)', lineHeight: 1 }}>{waterCount}</div>
            <div style={{ fontSize: 12, color: 'var(--brown-l)', fontWeight: 600 }}>次</div>
          </div>
          <button
            onClick={() => { const n = waterCount + 1; setWaterCount(n); saveWater(n, waterNote) }}
            style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--orange)', border: 'none', cursor: 'pointer', fontSize: 22, color: 'white', fontWeight: 700 }}>＋</button>
        </div>
        <input
          placeholder="備註，例如：中午有去浴室喝水、喝了約50cc"
          value={waterNote}
          onChange={e => setWaterNote(e.target.value)}
          onBlur={() => saveWater(waterCount, waterNote)}
          style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 12, color: 'var(--text)' }}
        />
      </div>

      {/* Reminders */}
      {reminders.length > 0 && (
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)', marginBottom: 10 }}>📌 待辦提醒</div>
          {reminders.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: i < reminders.length - 1 ? '0.5px solid var(--surface)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{r.task_name}</div>
                <div style={{ fontSize: 11, color: 'var(--brown-l)' }}>距上次已 {r.days} 天</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message board */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)', marginBottom: 12 }}>💬 留言板</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <input value={msgAuthor} onChange={e => setMsgAuthor(e.target.value)} placeholder="稱呼"
            style={{ width: 64, padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 12, color: 'var(--text)' }} />
          <input value={msgText} onChange={e => setMsgText(e.target.value)} placeholder="留言…"
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 10, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 12, color: 'var(--text)' }} />
          <button onClick={sendMessage} style={{ background: 'var(--orange-d)', color: 'white', border: 'none', borderRadius: 10, width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Send size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {messages.map(m => (
            <SwipeDelete key={m.id} onDelete={() => deleteMessage(m.id)}>
              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange-d)' }}>{m.author}・</span>
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>{m.content}</span>
                </div>
                <span style={{ fontSize: 10, color: 'var(--brown-l)', flexShrink: 0, marginTop: 2 }}>{format(new Date(m.created_at), 'H:mm')}</span>
              </div>
            </SwipeDelete>
          ))}
        </div>
      </div>

      {/* Feeding Modal */}
      <Modal open={feedModal} onClose={() => setFeedModal(false)} title="🍽️ 記錄餐點">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>時間</div>
            <input type="datetime-local" value={feedTime} onChange={e => setFeedTime(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 14, color: 'var(--text)' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>吃了什麼 *</div>
            <input value={feedDesc} onChange={e => setFeedDesc(e.target.value)} placeholder="例如：罐頭三湯匙、飼料一盤…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 14, color: 'var(--text)' }} />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {['飼料一盤', '飼料半盤', '罐頭半罐', '罐頭一罐', '零食少許'].map(t => (
                <button key={t} onClick={() => setFeedDesc(t)} style={{ padding: '5px 10px', borderRadius: 999, border: '1.5px solid var(--surface)', background: feedDesc === t ? 'var(--orange)' : 'var(--cream)', color: feedDesc === t ? 'white' : 'var(--text-s)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 4 }}>食慾評分</div>
            <StarRating value={feedAppetite} onChange={setFeedAppetite} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>備註（選填）</div>
            <textarea value={feedNote} onChange={e => setFeedNote(e.target.value)} placeholder="例如：吃完有吐、只吃一半…"
              rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 13, color: 'var(--text)', resize: 'none' }} />
          </div>
          <button onClick={saveMeal} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'var(--orange-d)', color: 'white', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>儲存</button>
        </div>
      </Modal>

      {/* View Meal Modal */}
      <Modal open={!!viewMeal} onClose={() => setViewMeal(null)} title="餐點詳細">
        {viewMeal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{viewMeal.food_desc}</div>
            <div style={{ fontSize: 14, color: 'var(--brown-l)' }}>🕐 {format(new Date(viewMeal.fed_at), 'yyyy/MM/dd HH:mm')}</div>
            {viewMeal.appetite > 0 && <div style={{ fontSize: 14 }}>食慾：{'⭐'.repeat(viewMeal.appetite)}</div>}
            {viewMeal.note && <div style={{ fontSize: 13, color: 'var(--text-s)', background: 'var(--surface)', padding: '8px 12px', borderRadius: 10 }}>{viewMeal.note}</div>}
            <button onClick={async () => { await deleteMeal(viewMeal.id); setViewMeal(null) }}
              style={{ marginTop: 8, padding: 13, borderRadius: 12, background: '#FDECEA', color: 'var(--red)', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Trash2 size={15} /> 刪除這筆紀錄
            </button>
          </div>
        )}
      </Modal>

      {/* Toilet Modal */}
      <Modal open={toiletModal} onClose={() => setToiletModal(false)} title={toiletType === 'pee' ? '💧 記錄尿尿' : '💩 記錄便便'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[['pee', '💧 尿尿'], ['poop', '💩 便便']].map(([t, l]) => (
              <button key={t} onClick={() => setToiletType(t)} style={{ padding: '11px 0', borderRadius: 12, border: '2px solid', borderColor: toiletType === t ? (t === 'pee' ? '#6BA3BE' : '#C07840') : 'transparent', background: toiletType === t ? (t === 'pee' ? '#E8F3F8' : '#FFF0E0') : 'var(--surface)', fontSize: 14, fontWeight: 700, color: toiletType === t ? (t === 'pee' ? '#3A6B8A' : '#8A5020') : 'var(--text-s)', cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>時間</div>
            <input type="datetime-local" value={toiletTime} onChange={e => setToiletTime(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 14, color: 'var(--text)' }} />
          </div>
          {toiletType === 'poop' && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 8 }}>便便狀況</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {POOP_OPTS.map(({ v, emoji }) => {
                  const c = poopColor(v)
                  return (
                    <button key={v} onClick={() => setPoopStatus(v)} style={{ padding: '11px 8px', borderRadius: 12, border: '2px solid', borderColor: poopStatus === v ? (v === '正常' ? '#6DB56A' : '#E85D4A') : 'transparent', background: poopStatus === v ? c.bg : 'var(--surface)', color: poopStatus === v ? c.text : 'var(--text-s)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{emoji} {v}</button>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>備註（選填）</div>
            <input value={toiletNote} onChange={e => setToiletNote(e.target.value)}
              placeholder={toiletType === 'pee' ? '例如：量很少、顏色偏黃…' : '例如：量很少、混有血絲…'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 13, color: 'var(--text)' }} />
          </div>
          <button onClick={saveToilet} style={{ width: '100%', padding: 14, borderRadius: 14, background: toiletType === 'pee' ? '#6BA3BE' : '#C07840', color: 'white', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>儲存</button>
        </div>
      </Modal>

      {/* View Toilet Modal */}
      <Modal open={!!viewToilet} onClose={() => setViewToilet(null)} title="上廁所紀錄詳細">
        {viewToilet && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>
              {viewToilet.type === 'pee' ? '💧 尿尿' : `💩 便便（${viewToilet.status || '未標注'}）`}
            </div>
            <div style={{ fontSize: 14, color: 'var(--brown-l)' }}>🕐 {format(new Date(viewToilet.logged_at), 'yyyy/MM/dd HH:mm')}</div>
            {viewToilet.note && <div style={{ fontSize: 13, color: 'var(--text-s)', background: 'var(--surface)', padding: '8px 12px', borderRadius: 10 }}>{viewToilet.note}</div>}
            <button onClick={async () => { await deleteToilet(viewToilet.id); setViewToilet(null) }}
              style={{ marginTop: 8, padding: 13, borderRadius: 12, background: '#FDECEA', color: 'var(--red)', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Trash2 size={15} /> 刪除這筆紀錄
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
