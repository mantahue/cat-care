const labels = ['', '幾乎不吃', '興趣缺缺', '普通', '吃得不錯', '超有食慾！']

export default function StarRating({ value, onChange }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, margin: '6px 0 4px' }}>
        {[1,2,3,4,5].map(n => (
          <button key={n} onClick={() => onChange(n)}
            style={{
              fontSize: 28, border: 'none', background: 'none', cursor: 'pointer', padding: 0,
              opacity: value >= n ? 1 : 0.25,
              filter: value >= n ? 'none' : 'grayscale(1)',
              transition: 'opacity .1s, transform .1s',
              transform: value === n ? 'scale(1.2)' : 'scale(1)',
            }}>⭐</button>
        ))}
      </div>
      {value > 0 && (
        <div style={{ fontSize: 12, color: 'var(--orange-d)', fontWeight: 700 }}>{labels[value]}</div>
      )}
    </div>
  )
}
