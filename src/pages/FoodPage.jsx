import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import { supabase, isConfigured } from '../lib/supabase'

const CATS = ['飼料', '罐頭', '零食']
const RATINGS = ['愛吃', '普通', '不吃']
const RATING_STYLE = {
  '愛吃': ['#FFE8E8', '#C0392B'],
  '普通': ['#FFF0E0', '#C0682A'],
  '不吃': ['#F5F0EB', '#888'],
}

const DEMO = [
  { id: '1', category: '飼料', brand: 'Hills Science Diet', name: 'Indoor 室內貓', rating: '愛吃', is_current: true, notes: '' },
  { id: '2', category: '飼料', brand: 'Royal Canin', name: '室內貓配方', rating: '普通', is_current: false, notes: '只有加水才吃' },
  { id: '3', category: '罐頭', brand: 'Wellness Core', name: '鮪魚+雞肉', rating: '愛吃', is_current: true, notes: '' },
  { id: '4', category: '罐頭', brand: 'Fancy Feast', name: '鮭魚口味', rating: '不吃', is_current: false, notes: '吃完偶爾會吐' },
  { id: '5', category: '零食', brand: 'Temptations', name: '雞肉口味', rating: '愛吃', is_current: false, notes: '' },
]

const emptyForm = (cat) => ({ category: cat, brand: '', name: '', rating: '愛吃', is_current: false, notes: '' })

export default function FoodPage() {
  const configured = isConfigured()
  const [items, setItems] = useState(configured ? [] : DEMO)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [activeTab, setActiveTab] = useState('飼料')
  const [form, setForm] = useState(emptyForm('飼料'))

  useEffect(() => { if (configured) load() }, [])

  const load = async () => {
    const { data } = await supabase.from('food_items').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  const openAdd = () => { setForm(emptyForm(activeTab)); setEditItem(null); setModal(true) }
  const openEdit = (item) => {
    setForm({ category: item.category, brand: item.brand, name: item.name, rating: item.rating, is_current: item.is_current, notes: item.notes || '' })
    setEditItem(item)
    setModal(true)
  }

  const save = async () => {
    if (!form.name.trim()) return
    if (editItem) {
      if (configured) { await supabase.from('food_items').update(form).eq('id', editItem.id); load() }
      else setItems(i => i.map(x => x.id === editItem.id ? { ...x, ...form } : x))
    } else {
      if (configured) { await supabase.from('food_items').insert(form); load() }
      else setItems(i => [{ ...form, id: Date.now().toString() }, ...i])
    }
    setModal(false)
  }

  const del = async (id) => {
    if (configured) await supabase.from('food_items').delete().eq('id', id)
    setItems(i => i.filter(x => x.id !== id))
  }

  const toggleCurrent = async (item) => {
    const val = !item.is_current
    if (configured) await supabase.from('food_items').update({ is_current: val }).eq('id', item.id)
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, is_current: val } : x))
  }

  const filtered = items.filter(x => x.category === activeTab)

  return (
    <div className="pb-nav fade-in" style={{ padding: '0 14px 14px' }}>
      <div style={{ padding: '16px 0 10px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>🥘 飲食偏好</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setActiveTab(c)} style={{
            flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
            background: activeTab === c ? 'var(--orange-d)' : 'var(--surface)',
            color: activeTab === c ? 'white' : 'var(--text-s)',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>{c}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)' }}>
            {activeTab}紀錄（{filtered.length}）
          </span>
          <button onClick={openAdd} style={{ background: 'var(--orange-d)', color: 'white', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} /> 新增
          </button>
        </div>

        {filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--brown-l)', textAlign: 'center', padding: '16px 0' }}>
            還沒有{activeTab}紀錄，點右上角新增吧！
          </div>
        ) : filtered.map(item => {
          const [bg, color] = RATING_STYLE[item.rating] || RATING_STYLE['不吃']
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--surface)' }}>
              <div style={{ fontSize: 26, width: 36, textAlign: 'center', flexShrink: 0 }}>
                {activeTab === '飼料' ? '🫙' : activeTab === '罐頭' ? '🥫' : '🎁'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{item.name}</span>
                  {item.is_current && (
                    <span style={{ background: 'var(--orange-d)', color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999 }}>餵食中</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--brown-l)' }}>{item.brand}</div>
                {item.notes && (
                  <div style={{ fontSize: 11, color: item.notes.includes('吐') ? 'var(--red)' : 'var(--text-s)', marginTop: 2 }}>{item.notes}</div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>{item.rating}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => toggleCurrent(item)} style={{
                    background: item.is_current ? '#E8F5E8' : 'var(--surface)',
                    color: item.is_current ? '#3A7A37' : 'var(--text-s)',
                    border: 'none', borderRadius: 8, padding: '3px 7px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  }}>{item.is_current ? '✓ 餵食中' : '設為餵食中'}</button>
                  <button onClick={() => openEdit(item)} style={{ background: 'var(--surface)', border: 'none', borderRadius: 8, padding: '3px 7px', cursor: 'pointer', color: 'var(--text-s)', display: 'flex', alignItems: 'center' }}>
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => del(item.id)} style={{ background: '#FDECEA', border: 'none', borderRadius: 8, padding: '3px 7px', cursor: 'pointer', color: 'var(--red)', display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? `✏️ 編輯${form.category}` : `➕ 新增${form.category}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>類型</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {CATS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, border: 'none',
                  background: form.category === c ? 'var(--orange-d)' : 'var(--surface)',
                  color: form.category === c ? 'white' : 'var(--text-s)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>{c}</button>
              ))}
            </div>
          </div>
          {[['品牌名稱', 'brand'], ['產品名稱 *', 'name']].map(([label, key]) => (
            <div key={key}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>{label}</div>
              <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 13, color: 'var(--text)' }} />
            </div>
          ))}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 8 }}>貓咪評價</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {RATINGS.map(r => (
                <button key={r} onClick={() => setForm(f => ({ ...f, rating: r }))} style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: '2px solid',
                  borderColor: form.rating === r ? 'var(--orange-d)' : 'transparent',
                  background: form.rating === r ? RATING_STYLE[r][0] : 'var(--surface)',
                  color: form.rating === r ? RATING_STYLE[r][1] : 'var(--text-s)',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>備註</div>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="例如：吃完會吐、只有加水才吃…"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 13, color: 'var(--text)' }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked }))} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>設為目前餵食中</span>
          </label>
          <button onClick={save} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'var(--orange-d)', color: 'white', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
            {editItem ? '儲存修改' : '儲存'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
