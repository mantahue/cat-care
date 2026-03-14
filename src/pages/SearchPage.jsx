import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import TagBadge from '../components/TagBadge'
import { supabase, isConfigured } from '../lib/supabase'

const ALL_TAGS = ['健檢', '腸胃', '牙科', '皮膚', '骨科', '疫苗', '手術', '嘔吐', '正常', '飲食']

const DEMO_RESULTS = [
  { type: 'medical', date: '2025/11/03', title: '定期健康檢查', desc: '血液報告正常，體重 4.8kg', tags: ['健檢', '正常'] },
  { type: 'medical', date: '2025/08/15', title: '嘔吐就診', desc: '腸胃炎，投予腸胃藥 3 天', tags: ['腸胃', '嘔吐'] },
  { type: 'food', date: '2025/07/10', title: 'Fancy Feast 鮭魚（罐頭）', desc: '吃完偶爾會吐，停止餵食', tags: ['飲食'] },
  { type: 'medical', date: '2025/03/20', title: '牙結石清除', desc: '麻醉洗牙，建議一年一次', tags: ['牙科'] },
]

export default function SearchPage() {
  const configured = isConfigured()
  const [q, setQ] = useState('')
  const [activeTag, setActiveTag] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!configured) {
      const r = DEMO_RESULTS.filter(x => {
        const matchTag = !activeTag || x.tags?.includes(activeTag)
        const matchQ = !q || x.title.includes(q) || x.desc?.includes(q)
        return matchTag && matchQ
      })
      setResults(r)
      return
    }
    search()
  }, [q, activeTag])

  const search = async () => {
    setLoading(true)
    const out = []
    let mq = supabase.from('medical_records').select('*').order('visit_date', { ascending: false })
    if (q) mq = mq.or(`reason.ilike.%${q}%,diagnosis.ilike.%${q}%,instructions.ilike.%${q}%`)
    if (activeTag) mq = mq.contains('tags', [activeTag])
    const { data: med } = await mq
    if (med) out.push(...med.map(r => ({ type: 'medical', date: r.visit_date?.replace(/-/g, '/'), title: r.reason, desc: [r.diagnosis, r.instructions].filter(Boolean).join('，'), tags: r.tags || [] })))
    if (!activeTag || activeTag === '飲食') {
      let fq = supabase.from('food_items').select('*')
      if (q) fq = fq.or(`name.ilike.%${q}%,brand.ilike.%${q}%,notes.ilike.%${q}%`)
      const { data: food } = await fq
      if (food) out.push(...food.map(f => ({ type: 'food', date: '', title: `${f.name}（${f.category}）`, desc: [f.brand, f.notes].filter(Boolean).join(' · '), tags: ['飲食'] })))
    }
    setResults(out)
    setLoading(false)
  }

  const TYPE_COLOR = { medical: ['#E8F3F8', '#2A6B8A', '醫療'], food: ['#E8F5E8', '#3A7A37', '飲食'] }

  return (
    <div className="pb-nav fade-in" style={{ padding: '0 14px 14px' }}>
      <div style={{ padding: '16px 0 10px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>🔍 搜尋紀錄</h1>
      </div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--brown-l)' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="輸入關鍵字搜尋…"
          style={{ width: '100%', padding: '11px 12px 11px 34px', borderRadius: 14, border: '1.5px solid var(--surface)', background: 'white', fontSize: 14, color: 'var(--text)' }} />
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6, marginBottom: 12 }} className="scrollbar-hide">
        <button onClick={() => setActiveTag(null)} style={{
          padding: '5px 12px', borderRadius: 999, border: '1.5px solid',
          borderColor: !activeTag ? 'var(--orange-d)' : 'var(--surface)',
          background: !activeTag ? 'var(--orange-d)' : 'white',
          color: !activeTag ? 'white' : 'var(--text-s)',
          fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>全部</button>
        {ALL_TAGS.map(t => (
          <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)} style={{
            padding: '5px 12px', borderRadius: 999, border: '1.5px solid',
            borderColor: activeTag === t ? 'var(--orange-d)' : 'var(--surface)',
            background: activeTag === t ? 'var(--orange-d)' : 'white',
            color: activeTag === t ? 'white' : 'var(--text-s)',
            fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>{t}</button>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--brown-l)' }}>搜尋中…</div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--brown-l)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>找不到相關紀錄</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>試試不同關鍵字或 tag</div>
        </div>
      ) : (
        <div className="card" style={{ padding: '0 16px' }}>
          {results.map((r, i) => {
            const [bg, color, typeLabel] = TYPE_COLOR[r.type] || ['#F5F0EB', '#7A6855', '其他']
            return (
              <div key={i} style={{ padding: '12px 0', borderBottom: i < results.length - 1 ? '0.5px solid var(--surface)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ background: bg, color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>{typeLabel}</span>
                  {r.date && <span style={{ fontSize: 11, color: 'var(--brown-l)' }}>{r.date}</span>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{r.title}</div>
                {r.desc && <div style={{ fontSize: 12, color: 'var(--text-s)', marginBottom: 6 }}>{r.desc}</div>}
                {r.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {r.tags.map(t => <TagBadge key={t} tag={t} />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
