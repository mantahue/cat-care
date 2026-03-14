import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { supabase, isConfigured } from '../lib/supabase'
import { format, differenceInDays, parseISO } from 'date-fns'

const DEMO_TASKS = [
  { id: '1', task_name: '年度健康檢查', frequency: 'yearly', last_done: '2025-11-03', notes: '' },
  { id: '2', task_name: '剪指甲', frequency: 'monthly', last_done: '2026-02-13', notes: '' },
  { id: '3', task_name: '清耳朵', frequency: 'monthly', last_done: '2026-03-01', notes: '' },
  { id: '4', task_name: '驅蟲', frequency: 'monthly', last_done: '2026-02-09', notes: '' },
  { id: '5', task_name: '餵保健品', frequency: 'daily', last_done: format(new Date(), 'yyyy-MM-dd'), notes: '關節靈活 + 魚油' },
]

const FREQ_THRESHOLD = { yearly: 365, monthly: 30, daily: 1 }
const FREQ_ICON = { '年度健康檢查': '🏥', '剪指甲': '✂️', '清耳朵': '👂', '驅蟲': '🐛', '餵保健品': '💊' }
const FREQ_COLOR = { yearly: '#FFF0E0', monthly: '#E8F3F8', daily: '#E8F5E8' }

function getStatus(task) {
  if (!task.last_done) return { label: '未紀錄', color: '#E85D4A', bg: '#FDECEA' }
  const days = differenceInDays(new Date(), parseISO(task.last_done))
  const th = FREQ_THRESHOLD[task.frequency]
  if (task.frequency === 'daily') {
    return days === 0
      ? { label: '今日完成', color: '#3A7A37', bg: '#E8F5E8' }
      : { label: '需要做了', color: '#E85D4A', bg: '#FDECEA' }
  }
  if (days >= th) return { label: '需要做了', color: '#E85D4A', bg: '#FDECEA' }
  if (days >= th * 0.8) return { label: '快到了', color: '#C0682A', bg: '#FFF0E0' }
  return { label: '正常', color: '#3A7A37', bg: '#E8F5E8' }
}

export default function RoutinePage() {
  const configured = isConfigured()
  const [tasks, setTasks] = useState(configured ? [] : DEMO_TASKS)
  const [confirming, setConfirming] = useState(null)

  useEffect(() => { if (configured) load() }, [])

  const load = async () => {
    const { data } = await supabase.from('routine_tasks').select('*')
    setTasks(data || [])
  }

  const markDone = async (task) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    if (configured) {
      await supabase.from('routine_tasks').update({ last_done: today }).eq('id', task.id)
      load()
    } else {
      setTasks(t => t.map(x => x.id === task.id ? { ...x, last_done: today } : x))
    }
    setConfirming(null)
  }

  const groups = [
    { freq: 'yearly', label: '年度任務', emoji: '📅' },
    { freq: 'monthly', label: '月度任務', emoji: '🗓️' },
    { freq: 'daily', label: '每日任務', emoji: '✅' },
  ]

  return (
    <div className="pb-nav fade-in" style={{ padding: '0 14px 14px' }}>
      <div style={{ padding: '16px 0 10px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>📋 例行公事</h1>
        <p style={{ fontSize: 12, color: 'var(--brown-l)', margin: '2px 0 0' }}>點擊按鈕記錄完成時間</p>
      </div>

      {groups.map(({ freq, label, emoji }) => {
        const list = tasks.filter(t => t.frequency === freq)
        if (list.length === 0) return null
        return (
          <div key={freq} className="card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)', marginBottom: 12 }}>
              {emoji} {label}
            </div>
            {list.map(task => {
              const status = getStatus(task)
              const days = task.last_done ? differenceInDays(new Date(), parseISO(task.last_done)) : null
              const icon = FREQ_ICON[task.task_name] || '📌'
              const iconBg = FREQ_COLOR[freq]
              return (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '0.5px solid var(--surface)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{task.task_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--brown-l)' }}>
                      {task.last_done
                        ? `上次：${task.last_done.replace(/-/g, '/')}${days !== null ? `（${days} 天前）` : ''}`
                        : '尚未紀錄'}
                      {task.notes ? ` · ${task.notes}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <span style={{ background: status.bg, color: status.color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>{status.label}</span>
                    {confirming === task.id ? (
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => setConfirming(null)} style={{ padding: '4px 8px', borderRadius: 8, border: 'none', background: 'var(--surface)', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'var(--text-s)' }}>取消</button>
                        <button onClick={() => markDone(task)} style={{ padding: '4px 8px', borderRadius: 8, border: 'none', background: 'var(--green)', color: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>確認</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirming(task.id)} style={{
                        padding: '5px 10px', borderRadius: 8, border: 'none',
                        background: 'var(--surface)', color: 'var(--text-s)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        <CheckCircle2 size={12} /> 完成
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
