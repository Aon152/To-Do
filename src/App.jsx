import { useState } from 'react'
import { Trash2, Plus, Check } from 'lucide-react'

const PRIORITY_LABEL = { low: 'ต่ำ', medium: 'กลาง', high: 'สูง' }
const NEXT_PRIORITY = { low: 'medium', medium: 'high', high: 'low' }
const FILTERS = [
  ['all', 'ทั้งหมด'],
  ['active', 'ยังไม่เสร็จ'],
  ['done', 'เสร็จแล้ว'],
]

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'ส่งรายงานโปรเจกต์', done: false, pri: 'high' },
    { id: 2, text: 'อ่านหนังสือเตรียมสอบ', done: false, pri: 'medium' },
    { id: 3, text: 'ซื้อของเข้าบ้าน', done: true, pri: 'low' },
  ])
  const [text, setText] = useState('')
  const [pri, setPri] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [nextId, setNextId] = useState(4)

  const add = () => {
    const t = text.trim()
    if (!t) return
    setTodos([{ id: nextId, text: t, done: false, pri }, ...todos])
    setNextId(nextId + 1)
    setText('')
  }

  const toggle = (id) =>
    setTodos((cur) => cur.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const cyclePriority = (id) =>
    setTodos((cur) => cur.map((t) => (t.id === id ? { ...t, pri: NEXT_PRIORITY[t.pri] } : t)))

  // Mark as "gone" first so the CSS exit animation plays, then remove from state.
  const removeIds = (ids) => {
    setTodos((cur) => cur.map((t) => (ids.includes(t.id) ? { ...t, gone: true } : t)))
    setTimeout(() => setTodos((cur) => cur.filter((t) => !ids.includes(t.id))), 280)
  }

  const commitEdit = () => {
    const t = editText.trim()
    if (t) setTodos((cur) => cur.map((x) => (x.id === editId ? { ...x, text: t } : x)))
    setEditId(null)
  }

  const live = todos.filter((t) => !t.gone)
  const remaining = live.filter((t) => !t.done).length
  const doneCount = live.filter((t) => t.done).length
  const shown = todos.filter((t) =>
    filter === 'all' ? true : filter === 'active' ? !t.done : t.done
  )

  return (
    <main className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">รายการงานของฉัน</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
        จดสิ่งที่ต้องทำ แล้วติ๊กเมื่อเสร็จ
      </p>

      {/* Add form */}
      <section className="card p-4 mb-4">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="เพิ่มงานใหม่…"
            aria-label="เพิ่มงานใหม่"
            className="flex-1 min-w-0 rounded-xl px-4 py-3 text-base bg-transparent"
            style={{ border: '1px solid var(--line)' }}
          />
          <button
            onClick={add}
            aria-label="เพิ่มงาน"
            className="flex items-center gap-1 rounded-xl px-4 font-semibold"
            style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
          >
            <Plus size={18} />
            <span className="hidden sm:inline">เพิ่ม</span>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-sm" style={{ color: 'var(--muted)' }}>ความสำคัญ:</span>
          {Object.keys(PRIORITY_LABEL).map((k) => (
            <button
              key={k}
              onClick={() => setPri(k)}
              aria-pressed={pri === k}
              className={`pill p-${k} rounded-full px-3 py-1 text-sm font-medium ${pri === k ? 'on' : ''}`}
            >
              {PRIORITY_LABEL[k]}
            </button>
          ))}
        </div>
      </section>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--line)' }} role="tablist">
        {FILTERS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={filter === k}
            onClick={() => setFilter(k)}
            className="flex-1 rounded-lg py-2 text-sm font-semibold transition-colors"
            style={
              filter === k
                ? { background: 'var(--card)', color: 'var(--text)', boxShadow: 'var(--shadow)' }
                : { color: 'var(--muted)' }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div>
        {shown.length === 0 && (
          <div className="card p-8 text-center" style={{ color: 'var(--muted)' }}>
            {filter === 'done'
              ? 'ยังไม่มีงานที่เสร็จ'
              : filter === 'active'
              ? 'ไม่มีงานค้าง เยี่ยมมาก!'
              : 'ยังไม่มีงาน เพิ่มงานแรกด้านบนได้เลย'}
          </div>
        )}

        {shown.map((t) => (
          <div
            key={t.id}
            className={`row${t.gone ? ' gone' : ''}`}
            style={{ maxHeight: 96, paddingBottom: 8 }}
          >
            <div className="card flex items-center gap-3 px-4 py-3">
              <button
                role="checkbox"
                aria-checked={t.done}
                aria-label="ทำเสร็จแล้ว"
                onClick={() => toggle(t.id)}
                className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                style={
                  t.done
                    ? { background: 'var(--accent)', color: 'var(--accent-fg)', border: '2px solid var(--accent)' }
                    : { border: '2px solid var(--muted)' }
                }
              >
                {t.done && <Check size={14} />}
              </button>

              {editId === t.id ? (
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit()
                    if (e.key === 'Escape') setEditId(null)
                  }}
                  aria-label="แก้ไขงาน"
                  className="flex-1 min-w-0 rounded-lg px-2 py-1 bg-transparent"
                  style={{ border: '1px solid var(--accent)' }}
                />
              ) : (
                <span
                  onDoubleClick={() => {
                    setEditId(t.id)
                    setEditText(t.text)
                  }}
                  title="ดับเบิลคลิกเพื่อแก้ไข"
                  className="flex-1 min-w-0 break-words cursor-text select-none"
                  style={t.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}
                >
                  {t.text}
                </span>
              )}

              <button
                onClick={() => cyclePriority(t.id)}
                title="กดเพื่อเปลี่ยนความสำคัญ"
                className={`p-${t.pri} shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold`}
              >
                {PRIORITY_LABEL[t.pri]}
              </button>

              <button
                onClick={() => removeIds([t.id])}
                aria-label="ลบงาน"
                className="shrink-0 p-1.5 rounded-lg hover:text-red-500 transition-colors"
                style={{ color: 'var(--muted)' }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 text-sm" style={{ color: 'var(--muted)' }}>
        <span>เหลืออีก {remaining} งาน</span>
        <button
          onClick={() => removeIds(live.filter((t) => t.done).map((t) => t.id))}
          disabled={!doneCount}
          className="font-semibold disabled:opacity-40"
          style={{ color: 'var(--accent)' }}
        >
          ล้างที่เสร็จแล้ว{doneCount ? ` (${doneCount})` : ''}
        </button>
      </div>
      <p className="mt-6 text-xs text-center" style={{ color: 'var(--muted)' }}>
        ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · กดป้ายความสำคัญเพื่อเปลี่ยนระดับ
      </p>
    </main>
  )
}
