const colorMap = {
  健檢: ['#E8F3F8', '#2A6B8A'],
  正常: ['#E8F5E8', '#3A7A37'],
  腸胃: ['#FFF0E0', '#C0682A'],
  嘔吐: ['#FDECEA', '#C0392B'],
  牙科: ['#E8F3F8', '#2A6B8A'],
  皮膚: ['#FFF8E0', '#8A6A00'],
  疫苗: ['#F0E8FF', '#5A3A9A'],
  骨科: ['#F5F0EB', '#7A6855'],
  飲食: ['#FFF0E0', '#C0682A'],
  手術: ['#FDECEA', '#C0392B'],
}

export default function TagBadge({ tag, onRemove }) {
  const [bg, color] = colorMap[tag] || ['#F5F0EB', '#7A6855']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg, color, fontSize: 11, fontWeight: 700,
      padding: '3px 9px', borderRadius: 999,
    }}>
      {tag}
      {onRemove && (
        <button onClick={onRemove} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color, padding: 0, lineHeight: 1, fontSize: 12,
        }}>×</button>
      )}
    </span>
  )
}
