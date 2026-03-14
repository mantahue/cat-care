import { useState, useEffect } from 'react'
import { Plus, Camera, X, Edit2, Trash2 } from 'lucide-react'
import Modal from '../components/Modal'
import TagBadge from '../components/TagBadge'
import { supabase, isConfigured } from '../lib/supabase'
import { format } from 'date-fns'

const ALL_TAGS = ['健檢', '腸胃', '牙科', '皮膚', '骨科', '疫苗', '手術', '嘔吐', '正常', '飲食']

const DEMO_RECORDS = [
  { id: '1', visit_date: '2025-11-03', reason: '定期健康檢查', diagnosis: '血液報告正常，體重 4.8kg', instructions: '建議多補充水分', tags: ['健檢', '正常'], photo_url: null },
  { id: '2', visit_date: '2025-08-15', reason: '嘔吐就診', diagnosis: '腸胃炎', instructions: '腸胃藥 3 天，每日 2 次', tags: ['腸胃', '嘔吐'], photo_url: null },
  { id: '3', visit_date: '2025-03-20', reason: '牙結石清除', diagnosis: '中度牙結石', instructions: '麻醉洗牙完成，一年後複診', tags: ['牙科'], photo_url: null },
]

const DEMO_SUPPS = [
  { id: '1', name: 'Omega-3 魚油', frequency: '每日', dosage: '1 顆', notes: '混入濕食', is_active: true },
  { id: '2', name: '關節靈活配方', frequency: '每日', dosage: '1/4 匙', notes: '早餐拌入', is_active: true },
]

const emptyForm = () => ({ visit_date: format(new Date(), 'yyyy-MM-dd'), reason: '', diagnosis: '', instructions: '', tags: [], photo_url: null })
const emptySuppForm = () => ({ name: '', frequency: '每日', dosage: '', notes: '' })

export default function MedicalPage() {
  const configured = isConfigured()
  const [records, setRecords] = useState(configured ? [] : DEMO_RECORDS)
  const [supps, setSupps] = useState(configured ? [] : DEMO_SUPPS)
  const [modal, setModal] = useState(false)
  const [editRecord, setEditRecord] = useState(null)
  const [suppModal, setSuppModal] = useState(false)
  const [editSupp, setEditSupp] = useState(null)
  const [filterTag, setFilterTag] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [suppForm, setSuppForm] = useState(emptySuppForm())
  const [uploading, setUploading] = useState(false)

  useEffect(() => { if (configured) { loadRecords(); loadSupps() } }, [])

  const loadRecords = async () => {
    const { data } = await supabase.from('medical_records').select('*').order('visit_date', { ascending: false })
    setRecords(data || [])
  }
  const loadSupps = async () => {
    const { data } = await supabase.from('supplements').select('*').eq('is_active', true).order('created_at')
    setSupps(data || [])
  }

  const openAdd = () => { setForm(emptyForm()); setEditRecord(null); setModal(true) }
  const openEdit = (r) => {
    setForm({ visit_date: r.visit_date, reason: r.reason, diagnosis: r.diagnosis || '', instructions: r.instructions || '', tags: r.tags || [], photo_url: r.photo_url || null })
    setEditRecord(r); setModal(true)
  }
  const openAddSupp = () => { setSuppForm(emptySuppForm()); setEditSupp(null); setSuppModal(true) }
  const openEditSupp = (s) => {
    setSuppForm({ name: s.name, frequency: s.frequency || '每日', dosage: s.dosage || '', notes: s.notes || '' })
    setEditSupp(s); setSuppModal(true)
  }

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !configured) return
    setUploading(true)
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `medical/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('cat-photos').upload(path, file)
    if (!error) {
      const { data: url } = supabase.storage.from('cat-photos').getPublicUrl(path)
      setForm(f => ({ ...f, photo_url: url.publicUrl }))
    }
    setUploading(false)
  }

  const saveRecord = async () => {
    if (!form.reason.trim()) return
    if (editRecord) {
      if (configured) { await supabase.from('medical_records').update(form).eq('id', editRecord.id); loadRecords() }
      else setRecords(r => r.map(x => x.id === editRecord.id ? { ...x, ...form } : x))
    } else {
      if (configured) { await supabase.from('medical_records').insert(form); loadRecords() }
      else setRecords(r => [{ ...form, id: Date.now().toString() }, ...r])
    }
    setModal(false)
  }

  const deleteRecord = async (id) => {
    if (configured) await supabase.from('medical_records').delete().eq('id', id)
    setRecords(r => r.filter(x => x.id !== id))
  }

  const saveSupp = async () => {
    if (!suppForm.name.trim()) return
    if (editSupp) {
      if (configured) { await supabase.from('supplements').update(suppForm).eq('id', editSupp.id); loadSupps() }
      else setSupps(s => s.map(x => x.id === editSupp.id ? { ...x, ...suppForm } : x))
    } else {
      if (configured) { await supabase.from('supplements').insert(suppForm); loadSupps() }
      else setSupps(s => [...s, { ...suppForm, id: Date.now().toString(), is_active: true }])
    }
    setSuppModal(false)
  }

  const deleteSupp = async (id) => {
    if (configured) await supabase.from('supplements').update({ is_active: false }).eq('id', id)
    setSupps(s => s.filter(x => x.id !== id))
  }

  const addTag = (t) => { if (!form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] })) }
  const removeTag = (t) => setForm(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))

  const filtered = filterTag ? records.filter(r => r.tags?.includes(filterTag)) : records

  return (
    <div className="pb-nav fade-in" style={{ padding: '0 14px 14px' }}>
      <div style={{ padding: '16px 0 10px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', margin: 0 }}>🏥 醫療紀錄</h1>
      </div>

      {/* Supplements */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)' }}>目前保健品</span>
          <button onClick={openAddSupp} style={{ background: 'var(--surface)', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text-s)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={12} /> 新增
          </button>
        </div>
        {supps.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--brown-l)', textAlign: 'center', padding: '8px 0' }}>尚無保健品紀錄</div>
        ) : supps.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderBottom: '0.5px solid var(--surface)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-s)' }}>{s.frequency}{s.dosage && ` · ${s.dosage}`}{s.notes && ` · ${s.notes}`}</div>
            </div>
            <button onClick={() => openEditSupp(s)} style={{ background: 'var(--surface)', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: 'var(--text-s)' }}><Edit2 size={12} /></button>
            <button onClick={() => deleteSupp(s.id)} style={{ background: '#FDECEA', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer', color: 'var(--red)' }}><Trash2 size={12} /></button>
          </div>
        ))}
      </div>

      {/* Tag filter */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 10 }} className="scrollbar-hide">
        <button onClick={() => setFilterTag(null)} style={{ padding: '5px 12px', borderRadius: 999, border: '1.5px solid', borderColor: !filterTag ? 'var(--orange-d)' : 'var(--surface)', background: !filterTag ? 'var(--orange-d)' : 'var(--cream)', color: !filterTag ? 'white' : 'var(--text-s)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>全部</button>
        {ALL_TAGS.map(t => (
          <button key={t} onClick={() => setFilterTag(filterTag === t ? null : t)} style={{ padding: '5px 12px', borderRadius: 999, border: '1.5px solid', borderColor: filterTag === t ? 'var(--orange-d)' : 'var(--surface)', background: filterTag === t ? 'var(--orange-d)' : 'var(--cream)', color: filterTag === t ? 'white' : 'var(--text-s)', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t}</button>
        ))}
      </div>

      {/* Records */}
      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown-l)' }}>看診紀錄</span>
          <button onClick={openAdd} style={{ background: 'var(--orange-d)', color: 'white', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} /> 新增
          </button>
        </div>
        {filtered.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--brown-l)', textAlign: 'center', padding: '12px 0' }}>尚無看診紀錄</div>
        ) : filtered.map((r, i) => (
          <div key={r.id} style={{ padding: '12px 0', borderBottom: i < filtered.length - 1 ? '0.5px solid var(--surface)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--brown-l)', fontWeight: 600 }}>{r.visit_date?.replace(/-/g, '/')}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: '2px 0' }}>{r.reason}</div>
                {r.diagnosis && <div style={{ fontSize: 12, color: 'var(--text-s)', marginBottom: 2 }}>診斷：{r.diagnosis}</div>}
                {r.instructions && <div style={{ fontSize: 12, color: 'var(--text-s)', marginBottom: 4 }}>醫囑：{r.instructions}</div>}
                {r.photo_url && <img src={r.photo_url} alt="附件" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'cover', marginBottom: 6 }} />}
                {r.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {r.tags.map(t => <TagBadge key={t} tag={t} />)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                <button onClick={() => openEdit(r)} style={{ background: 'var(--surface)', border: 'none', borderRadius: 8, padding: '5px 7px', cursor: 'pointer', color: 'var(--text-s)' }}><Edit2 size={13} /></button>
                <button onClick={() => deleteRecord(r.id)} style={{ background: '#FDECEA', border: 'none', borderRadius: 8, padding: '5px 7px', cursor: 'pointer', color: 'var(--red)' }}><Trash2 size={13} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Record Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editRecord ? '✏️ 編輯看診紀錄' : '🏥 新增看診紀錄'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['看診日期', 'visit_date', 'date'], ['看診原因 *', 'reason', 'text'], ['診斷結果', 'diagnosis', 'text'], ['醫囑', 'instructions', 'text']].map(([label, key, type]) => (
            <div key={key}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>{label}</div>
              <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 13, color: 'var(--text)' }} />
            </div>
          ))}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 8 }}>標籤</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {ALL_TAGS.map(t => (
                <button key={t} onClick={() => form.tags.includes(t) ? removeTag(t) : addTag(t)} style={{ padding: '4px 10px', borderRadius: 999, background: form.tags.includes(t) ? 'var(--orange-d)' : 'var(--surface)', color: form.tags.includes(t) ? 'white' : 'var(--text-s)', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {form.tags.map(t => <TagBadge key={t} tag={t} onRemove={() => removeTag(t)} />)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>附件照片（選填）</div>
            {form.photo_url ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={form.photo_url} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover' }} />
                <button onClick={() => setForm(f => ({ ...f, photo_url: null }))} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, background: 'var(--red)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={10} />
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, border: '1.5px dashed var(--surface)', cursor: 'pointer', color: 'var(--text-s)', fontSize: 13 }}>
                <Camera size={16} />
                {uploading ? '上傳中…' : '點擊上傳照片'}
                <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <button onClick={saveRecord} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'var(--orange-d)', color: 'white', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
            {editRecord ? '儲存修改' : '儲存看診紀錄'}
          </button>
        </div>
      </Modal>

      {/* Supplement Modal */}
      <Modal open={suppModal} onClose={() => setSuppModal(false)} title={editSupp ? '✏️ 編輯保健品' : '💊 新增保健品'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[['保健品名稱 *', 'name'], ['頻率', 'frequency'], ['用量', 'dosage'], ['備註', 'notes']].map(([label, key]) => (
            <div key={key}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', marginBottom: 6 }}>{label}</div>
              <input value={suppForm[key]} onChange={e => setSuppForm(f => ({ ...f, [key]: e.target.value }))}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1.5px solid var(--surface)', background: 'var(--cream)', fontSize: 13, color: 'var(--text)' }} />
            </div>
          ))}
          <button onClick={saveSupp} style={{ width: '100%', padding: 14, borderRadius: 14, background: 'var(--orange-d)', color: 'white', border: 'none', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
            {editSupp ? '儲存修改' : '儲存'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
