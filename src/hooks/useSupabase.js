import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

export function useTable(table, query = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!isConfigured()) { setLoading(false); return }
    setLoading(true)
    let q = supabase.from(table).select('*')
    if (query.order) q = q.order(query.order, { ascending: query.asc ?? false })
    if (query.eq) q = q.eq(query.eq[0], query.eq[1])
    if (query.limit) q = q.limit(query.limit)
    const { data: rows } = await q
    setData(rows || [])
    setLoading(false)
  }, [table])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, refetch: fetch }
}

export function useDailyLog(date) {
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!isConfigured()) { setLoading(false); return }
    const { data } = await supabase.from('daily_logs').select('*').eq('log_date', date).single()
    setLog(data)
    setLoading(false)
  }, [date])

  useEffect(() => { fetch() }, [fetch])

  const upsert = async (updates) => {
    if (!isConfigured()) return
    const { data } = await supabase.from('daily_logs')
      .upsert({ log_date: date, ...updates }, { onConflict: 'log_date' })
      .select().single()
    setLog(data)
  }

  return { log, loading, upsert, refetch: fetch }
}

export function useCatProfile() {
  const [profile, setProfile] = useState({ name: '豆皮', avatar_url: null })

  useEffect(() => {
    if (!isConfigured()) return
    supabase.from('cat_profile').select('*').eq('id', 1).single()
      .then(({ data }) => { if (data) setProfile(data) })
  }, [])

  const update = async (updates) => {
    if (!isConfigured()) return
    await supabase.from('cat_profile').upsert({ id: 1, ...updates })
    setProfile(p => ({ ...p, ...updates }))
  }

  return { profile, update }
}
