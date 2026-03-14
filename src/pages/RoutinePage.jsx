import { useState, useEffect } from 'react'
import { CheckCircle2, Plus, Trash2, Edit2 } from 'lucide-react'
import Modal from '../components/Modal'
import { supabase, isConfigured } from '../lib/supabase'
import { format, differenceInDays, parseISO } from 'date-fns'

const FREQ_THRESHOLD = { yearly: 365, monthly: 30, weekly: 7, daily: 1 }
const FREQ_LABEL = { yearly: '每年', monthly: '每月', weekly: '每週', daily: '每日' }
const FREQ_COLOR = { yearly: '#FFF0E0', monthly: '#E8F3F8', weekly: '#F0E8FF', daily: '#E8F5E8' }
const DEFAULT_ICONS = { '年度健康檢查': '🏥', '剪指甲': '✂️', '清耳朵': '👂', '驅蟲': '🐛', '餵保健品': '💊' }

const DEMO_TASKS = [
  { id: '1', task_name: '年度健康檢查', frequency: 'yearly', last_done: '2025-11-03', notes: '', icon: '🏥', next_due: null },
  { id: '2', task_name: '剪指甲', frequency: 'monthly', last_done: '2026-02-13', notes: '', icon: '✂️', next_due: null },
  { id: '3', task_name: '清耳朵', frequency: 'monthly', last_done: '2026-03-01', notes: '', icon: '👂', next_due: null },
  { id: '4', task_name: '驅蟲', frequency: 'monthly', last_done: '2026-02-09', notes: '', icon: '🐛', next_due: null },
  { id: '5', task_name: '餵保健品（魚油）', frequency: 'daily', last_done: format(new Date(), 'yyyy-MM-dd'), notes: '每日1顆，混入濕食', icon: '💊', next_due: null },
]

const EMOJI_OPTIONS = ['💊','🏥','✂️','👂','🐛','🛁','🦷','💉','🩺','🧴','🥩','🐟','🌿','⚖️','🚿','🧹','❤️','⭐']

function getStatus(task) {
  if (!task.last_done) return { label: '未紀錄', color: '#E85D4A', bg: '#FDECEA' }
  const days = differenceInDays(new Date(), parseISO(task.last_done))
  const th = FREQ_THRESHOLD[task.frequency] || 30
  if (task.frequency === 'daily') {
    return days === 0 ? { label: '今日完成', color: '#3A7A37', bg: '#E8F5E8' } : { label: '需要做了', color: '#E85D4A', bg: '#FDECEA' }
  }
  if (days >= th) return { label: '需要做了', color: '#E85D4A', bg: '#FDECEA' }
  if (days >= th * 0.8) return { label: '快到了', color: '#C0682A', bg: '#FFF0E0' }
  return { label: '正常', color: '#3A7A37', bg: '#E8F5E8' }
}

export default function RoutinePage() {
  const configured = isConfigured()
  const [tasks, setTasks] = useState(configured ? [] : DEMO_TASKS)
  const [confirming, setConfirming] = useState(null)
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({ task_name: '', frequency: 'monthly', notes: '', icon: '📌', next_due: '' })

  useEffect(() => { if (configured) load() }, [])

  const load = async () => {
    const { data } = await supabase.from('routine_tasks').select('*').order('created_at', { ascending: true })
    setTasks(data || [])
  }

  const openAdd = () => {
    setForm({ task_name: '', frequency: 'monthly', notes: '', icon: '📌', next_due: '' })
    setAddModal(true)
  }

  const openEdit = (task) => {
    setForm({ task_name: task.task_name, frequency: task.frequency, notes: task.notes || '', icon: task.icon || '📌', next_due: task.next_due || '' })
    setEditModal(task)
  }

  const saveNew = async () => {
    if (!form.task_name.trim()) return
    const entry = { task_name: form.task_name, frequency: form.frequency, notes: form.notes, icon: form.icon, next_due: form.next_due || null, last_done: null }
    if (configured) { await supabase.from('routine_tasks').insert(entry); load() }
    else setTasks(t => [...t, { ...entry, id: Date.now().toString() }])
    setAddModal(false)
  }

  const saveEdit = async () => {
    if (!form.task_name.trim()) return
    const updates = { task_name: form.task_name, frequency: form.frequency, notes: form.notes, icon: form.icon, next_due: form.next_due || null }
    if (configured) { await supabase.from('routine_tasks').update(updates).eq('id', editModal.id); load() }
    else setTasks(t => t.map(x => x.id === editModal.id ? { ...x, ...updates } : x))
    setEditModal(null)
  }

  const del = async (id) => {
    if (configured) await supabase.from('routine_tasks').delete().eq('id', id)
    setTasks(t => t.filter(x => x.id !== id))
  }

  const markDone = async (task) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (configured) { await supabase.from('routine_tasks').update({ last_done: today }).eq('id', task.id); load() }
    else setTasks(t => t.map(x => x.id === task.id ? { ...x, last_done: today } : x))
    setConfirming(null)
  }

  const groups = [
    { freq: 'daily', label: '每日任務', emoji: '✅' },
    { freq: 'weekly', label: '每週任務', emoji: '📆' },
    { freq: 'monthly', label: '月度任務', emoji: '🗓️' },
    { freq: 'yearly', label: '年度任務', emoji: '📅' },
  ]

  const TaskForm = ({ onSave }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>任務名稱 *</div>
        <input value={form.task_name} onChange={e => setForm(f => ({ ...f, task_name: e.target.value }))}
          placeholder="例如：餵保健品（關節靈活）"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 13, color: 'var(--text)' }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 8 }}>重複頻率</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
          {Object.entries(FREQ_LABEL).map(([k, v]) => (
            <button key={k} onClick={() => setForm(f => ({ ...f, frequency: k }))} style={{
              padding: '8px 4px', borderRadius: 10, border: '2px solid',
              borderColor: form.frequency === k ? 'var(--orange-d)' : 'transparent',
              background: form.frequency === k ? '#FFF0E0' : 'var(--surface)',
              color: form.frequency === k ? 'var(--orange-d)' : 'var(--text-s)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>{v}</button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>下次預定日期（選填）</div>
        <input type="date" value={form.next_due} onChange={e => setForm(f => ({ ...f, next_due: e.target.value }))}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 13, color: 'var(--text)' }} />
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 8 }}>圖示</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {EMOJI_OPTIONS.map(e => (
            <button key={e} onClick={() => setForm(f => ({ ...f, icon: e }))} style={{
              width: 36, height: 36, borderRadius: 8, border: '2px solid',
              borderColor: form.icon === e ? 'var(--orange-d)' : 'transparent',
              background: form.icon === e ? '#FFF0E0' : 'var(--surface)',
              fontSize: 18, cursor: 'pointer',
            }}>{e}</button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>備註（選填）</div>
        <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="例如：每日1顆，混入濕食"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 13, color: 'var(--text)' }} />
      </div>
      <button onClick={onSave} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'var(--orange-d)', color: 'white', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>儲存</button>
    </div>
  )

  return (
    <div className="pb-nav fade-in" style={{ padding: '0 14px 14px' }}>
      <div style={{ padding: '16px 0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>📋 例行公事</h1>
          <p style={{ fontSize: 12, color: 'var(--brown-l)', margin: '2px 0 0' }}>點「完成」記錄時間</p>
        </div>
        <button onClick={openAdd} style={{
          background: 'var(--orange-d)', color: 'white', border: 'none', borderRadius: 12,
          padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}><Plus size={14} /> 新增</button>
      </div>

      {groups.map(({ freq, label, emoji }) => {
        const list = tasks.filter(t => t.frequency === freq)
        if (list.length === 0) return null
        return (
          <div key={freq} className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)', marginBottom: 12 }}>{emoji} {label}</div>
            {list.map(task => {
              const status = getStatus(task)
              const days = task.last_done ? differenceInDays(new Date(), parseISO(task.last_done)) : null
              const icon = task.icon || DEFAULT_ICONS[task.task_name] || '📌'
              const iconBg = FREQ_COLOR[freq] || '#F5F0EB'
              const isDue = task.next_due && new Date(task.next_due) <= new Date()
              return (
                <div key={task.id} style={{ padding: '10px 0', borderBottom: '0.5px solid var(--surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{task.task_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--brown-l)' }}>
                        {task.last_done ? `上次：${task.last_done.replace(/-/g, '/')}（${days}天前）` : '尚未紀錄'}
                        {task.notes ? ` · ${task.notes}` : ''}
                      </div>
                      {task.next_due && (
                        <div style={{ fontSize: 11, color: isDue ? '#E85D4A' : 'var(--blue)', fontWeight: 600 }}>
                          {isDue ? '⚠️ 預定：' : '📅 預定：'}{task.next_due.replace(/-/g, '/')}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                      <span style={{ background: status.bg, color: status.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>{status.label}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(task)} style={{ padding: '4px 7px', borderRadius: 8, border: 'none', background: 'var(--surface)', fontSize: 11, cursor: 'pointer', color: 'var(--text-s)', display: 'flex', alignItems: 'center' }}>
                          <Edit2 size={11} />
                        </button>
                        {confirming === task.id ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => setConfirming(null)} style={{ padding: '4px 8px', borderRadius: 8, border: 'none', background: 'var(--surface)', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--text-s)' }}>取消</button>
                            <button onClick={() => markDone(task)} style={{ padding: '4px 8px', borderRadius: 8, border: 'none', background: 'var(--green)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>確認</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirming(task.id)} style={{ padding: '4px 7px', borderRadius: 8, border: 'none', background: 'var(--surface)', color: 'var(--text-s)', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CheckCircle2 size={11} /> 完成
                          </button>
                        )}
                        <button onClick={() => del(task.id)} style={{ padding: '4px 7px', borderRadius: 8, border: 'none', background: '#FDECEA', color: 'var(--red)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {tasks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--brown-l)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>還沒有例行任務</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>點右上角「新增」建立第一個任務</div>
        </div>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="➕ 新增任務">
        <TaskForm onSave={saveNew} />
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="✏️ 編輯任務">
        <TaskForm onSave={saveEdit} />
      </Modal>
    </div>
  )
}
