import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Modal from '../components/Modal'
import SwipeDelete from '../components/SwipeDelete'
import { supabase, isConfigured } from '../lib/supabase'
import { format } from 'date-fns'

const DEMO_WEIGHTS = [
  { id: '1', measured_date: '2022-11-10', weight_kg: 4.5, note: '年度健檢' },
  { id: '2', measured_date: '2023-11-08', weight_kg: 4.7, note: '年度健檢' },
  { id: '3', measured_date: '2024-11-12', weight_kg: 4.9, note: '年度健檢' },
  { id: '4', measured_date: '2025-03-05', weight_kg: 4.8, note: '腸胃炎就診' },
  { id: '5', measured_date: '2025-11-03', weight_kg: 4.8, note: '年度健檢' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid #F5F0EB', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: '#7A4F2D' }}>{label}</div>
      <div style={{ fontWeight: 800, color: '#E67A2D', fontSize: 15 }}>{payload[0].value} kg</div>
      {payload[0].payload.note && <div style={{ color: '#7A6855' }}>{payload[0].payload.note}</div>}
    </div>
  )
}

export default function HealthPage() {
  const configured = isConfigured()
  const [weights, setWeights] = useState(configured ? [] : DEMO_WEIGHTS)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ measured_date: format(new Date(), 'yyyy-MM-dd'), weight_kg: '', note: '' })

  useEffect(() => { if (configured) load() }, [])

  const load = async () => {
    const { data } = await supabase.from('weight_logs').select('*').order('measured_date')
    setWeights(data || [])
  }

  const save = async () => {
    if (!form.weight_kg) return
    if (configured) { await supabase.from('weight_logs').insert({ ...form, weight_kg: parseFloat(form.weight_kg) }); load() }
    else setWeights(w => [...w, { ...form, id: Date.now().toString(), weight_kg: parseFloat(form.weight_kg) }].sort((a, b) => a.measured_date.localeCompare(b.measured_date)))
    setModal(false)
  }

  const del = async (id) => {
    if (configured) await supabase.from('weight_logs').delete().eq('id', id)
    setWeights(w => w.filter(x => x.id !== id))
  }

  const chartData = weights.map(w => ({
    date: w.measured_date.slice(5).replace('-', '/'),
    weight: parseFloat(w.weight_kg),
    note: w.note,
  }))

  const latest = weights[weights.length - 1]
  const prev = weights[weights.length - 2]
  const diff = latest && prev ? (parseFloat(latest.weight_kg) - parseFloat(prev.weight_kg)).toFixed(1) : null

  return (
    <div style={{ padding: '0 0 14px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>⚖️ 體重追蹤</span>
        <button onClick={() => { setForm({ measured_date: format(new Date(), 'yyyy-MM-dd'), weight_kg: '', note: '' }); setModal(true) }}
          style={{ background: 'var(--orange-d)', color: 'white', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={13} /> 新增
        </button>
      </div>

      {latest && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, background: 'var(--orange-d)', borderRadius: 14, padding: '12px 14px', color: 'white' }}>
            <div style={{ fontSize: 11, opacity: .8 }}>最新體重</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{parseFloat(latest.weight_kg)} <span style={{ fontSize: 13 }}>kg</span></div>
            <div style={{ fontSize: 11, opacity: .8 }}>{latest.measured_date.replace(/-/g, '/')}</div>
          </div>
          {diff !== null && (
            <div style={{ flex: 1, background: parseFloat(diff) > 0 ? '#FFF0E0' : parseFloat(diff) < 0 ? '#E8F5E8' : 'var(--surface)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--brown-l)' }}>與上次相比</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: parseFloat(diff) > 0 ? '#C0682A' : parseFloat(diff) < 0 ? '#3A7A37' : 'var(--text)' }}>
                {parseFloat(diff) > 0 ? '▲' : parseFloat(diff) < 0 ? '▼' : '—'} {Math.abs(parseFloat(diff))} <span style={{ fontSize: 13 }}>kg</span>
              </div>
            </div>
          )}
        </div>
      )}

      {chartData.length > 1 && (
        <div style={{ background: 'white', borderRadius: 14, padding: '14px 8px 8px', marginBottom: 12, boxShadow: '0 2px 10px rgba(122,79,45,0.07)' }}>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F0EB" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#A67C52' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#A67C52' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="weight" stroke="#E67A2D" strokeWidth={2.5} dot={{ fill: '#E67A2D', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {[...weights].reverse().map(w => (
          <SwipeDelete key={w.id} onDelete={() => del(w.id)}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 0', borderBottom: '0.5px solid var(--surface)', gap: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--brown-l)', width: 72, flexShrink: 0 }}>{w.measured_date.replace(/-/g, '/')}</div>
              <div style={{ fontWeight: 800, color: 'var(--orange-d)', fontSize: 15, width: 48 }}>{parseFloat(w.weight_kg)} kg</div>
              <div style={{ fontSize: 12, color: 'var(--text-s)', flex: 1 }}>{w.note || ''}</div>
            </div>
          </SwipeDelete>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="⚖️ 紀錄體重">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>量測日期（可補登過去日期）</div>
            <input type="date" value={form.measured_date} onChange={e => setForm(f => ({ ...f, measured_date: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 14, color: 'var(--text)' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>體重 (kg) *</div>
            <input type="number" step="0.01" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} placeholder="例如：4.80"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 20, fontWeight: 700, color: 'var(--text)', textAlign: 'center' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>備註（例如：年度健檢、看診時測量）</div>
            <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 13, color: 'var(--text)' }} />
          </div>
          <button onClick={save} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'var(--orange-d)', color: 'white', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>儲存</button>
        </div>
      </Modal>
    </div>
  )
}
