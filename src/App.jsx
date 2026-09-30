import { useState } from 'react'
import {
  Trash2, Plus, Check, Search, Calendar, LayoutList,
  Briefcase, User, ShoppingCart, HeartPulse,
} from 'lucide-react'

const PRIORITY_LABEL = { low: 'ต่ำ', medium: 'กลาง', high: 'สูง' }
const NEXT_PRIORITY = { low: 'medium', medium: 'high', high: 'low' }
const FILTERS = [['all', 'ทั้งหมด'], ['active', 'ยังไม่เสร็จ'], ['done', 'เสร็จแล้ว']]
const CATS = {
  work: { label: 'งาน', Icon: Briefcase },
  personal: { label: 'ส่วนตัว', Icon: User },
  shopping: { label: 'ช้อปปิ้ง', Icon: ShoppingCart },
  health: { label: 'สุขภาพ', Icon: HeartPulse },
}

const pad = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d) }
const fmtDate = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })

/* ---------- Donut chart ---------- */
function Donut({ segments, centerText }) {
  const size = 92, r = 36, sw = 13, C = 2 * Math.PI * r
  const total = segments.reduce((a, s) => a + s.value, 0)
  let acc = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="สัดส่วนสถานะงาน" className="shrink-0">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={sw} />
        {total > 0 && segments.map((s) => {
          if (!s.value) return null
          const len = (s.value / total) * C
          const el = (
            <circle key={s.key} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={sw}
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />
          )
          acc += len
          return el
        })}
      </g>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize="17" fontWeight="700" fill="var(--text)">
        {centerText}
      </text>
    </svg>
  )
}

/* ---------- Due date badge (click to pick a date) ---------- */
function DueBadge({ todo, today, onChange }) {
  let cls = 'tag', label = todo.due ? fmtDate(todo.due) : 'กำหนดวัน'
  if (!todo.due) cls = 'due-none'
  else if (!todo.done && todo.due < today) { cls = 'p-high'; label = `เลยกำหนด ${label}` }
  else if (!todo.done && todo.due === today) { cls = 'p-medium'; label = 'วันนี้' }
  return (
    <label className={`${cls} relative inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold cursor-pointer`}>
      <Calendar size={12} />
      {label}
      <input
        type="date"
        value={todo.due || ''}
        aria-label="กำหนดส่ง"
        onChange={(e) => onChange(e.target.value || null)}
        onClick={(e) => { try { e.currentTarget.showPicker?.() } catch { /* ignore */ } }}
        className="date-input absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </label>
  )
}

export default function App() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'ส่งรายงานโปรเจกต์', done: false, pri: 'high', cat: 'work', due: addDays(-2) },
    { id: 2, text: 'ประชุมทีมประจำสัปดาห์', done: false, pri: 'medium', cat: 'work', due: addDays(0) },
    { id: 3, text: 'ซื้อผักและผลไม้', done: false, pri: 'low', cat: 'shopping', due: addDays(1) },
    { id: 4, text: 'วิ่งออกกำลังกาย 30 นาที', done: true, pri: 'medium', cat: 'health', due: addDays(0) },
    { id: 5, text: 'โทรหาที่บ้าน', done: false, pri: 'low', cat: 'personal', due: null },
  ])
  const [text, setText] = useState('')
  const [pri, setPri] = useState('medium')
  const [newCat, setNewCat] = useState('personal')
  const [newDue, setNewDue] = useState('')
  const [filter, setFilter] = useState('all')
  const [catFilter, setCatFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [nextId, setNextId] = useState(6)

  const today = ymd(new Date())

  const add = () => {
    const t = text.trim()
    if (!t) return
    setTodos([{ id: nextId, text: t, done: false, pri, cat: newCat, due: newDue || null }, ...todos])
    setNextId(nextId + 1)
    setText('')
    setNewDue('')
  }
  const patch = (id, changes) => setTodos((cur) => cur.map((t) => (t.id === id ? { ...t, ...changes } : t)))
  const removeIds = (ids) => {
    setTodos((cur) => cur.map((t) => (ids.includes(t.id) ? { ...t, gone: true } : t)))
    setTimeout(() => setTodos((cur) => cur.filter((t) => !ids.includes(t.id))), 280)
  }
  const commitEdit = () => {
    const t = editText.trim()
    if (t) patch(editId, { text: t })
    setEditId(null)
  }
  const pickCategory = (k) => {
    setCatFilter(k)
    if (k !== 'all') setNewCat(k)
  }

  /* derived data */
  const live = todos.filter((t) => !t.gone)
  const remaining = live.filter((t) => !t.done).length
  const doneCount = live.filter((t) => t.done).length
  const overdueCount = live.filter((t) => !t.done && t.due && t.due < today).length
  const activeCount = remaining - overdueCount
  const pct = live.length ? Math.round((doneCount / live.length) * 100) : 0
  const catCount = (k) => live.filter((t) => t.cat === k).length

  const q = query.trim().toLowerCase()
  const shown = todos.filter((t) =>
    (filter === 'all' ? true : filter === 'active' ? !t.done : t.done) &&
    (catFilter === 'all' || t.cat === catFilter) &&
    (!q || t.text.toLowerCase().includes(q))
  )

  const segments = [
    { key: 'done', label: 'เสร็จแล้ว', value: doneCount, color: 'var(--done)' },
    { key: 'active', label: 'ค้างอยู่', value: activeCount, color: 'var(--accent)' },
    { key: 'over', label: 'เลยกำหนด', value: overdueCount, color: 'var(--over)' },
  ]

  const navItems = [['all', 'ทั้งหมด', LayoutList, live.length],
    ...Object.entries(CATS).map(([k, c]) => [k, c.label, c.Icon, catCount(k)])]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold mb-1">รายการงานของฉัน</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>จดสิ่งที่ต้องทำ แล้วติ๊กเมื่อเสร็จ</p>

      <div className="grid gap-5 md:grid-cols-[230px_1fr] items-start">
        {/* ---------- Sidebar ---------- */}
        <aside className="space-y-4 md:sticky md:top-6">
          <section className="card p-4 flex items-center gap-4" aria-label="สถิติ">
            <Donut segments={segments} centerText={`${pct}%`} />
            <div className="text-sm min-w-0">
              <div className="leading-tight">
                <span className="text-2xl font-bold">{live.length}</span> งานทั้งหมด
              </div>
              <div className="mb-1" style={{ color: 'var(--muted)' }}>เสร็จแล้ว {pct}%</div>
              {segments.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span>{s.label}</span>
                  <span className="ml-auto font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </section>

          <nav aria-label="หมวดหมู่" className="chips flex md:flex-col gap-2 overflow-x-auto pb-1 md:pb-0">
            {navItems.map(([k, label, Icon, count]) => (
              <button
                key={k}
                onClick={() => pickCategory(k)}
                aria-pressed={catFilter === k}
                className="shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
                style={catFilter === k
                  ? { background: 'var(--card)', color: 'var(--accent)', boxShadow: 'var(--shadow)' }
                  : { color: 'var(--muted)' }}
              >
                <Icon size={16} />
                <span>{label}</span>
                <span className="ml-auto rounded-full px-2 text-xs tag">{count}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ---------- Main ---------- */}
        <main className="min-w-0">
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
              <button onClick={add} aria-label="เพิ่มงาน"
                className="flex items-center gap-1 rounded-xl px-4 font-semibold"
                style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}>
                <Plus size={18} />
                <span className="hidden sm:inline">เพิ่ม</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>ความสำคัญ:</span>
              {Object.keys(PRIORITY_LABEL).map((k) => (
                <button key={k} onClick={() => setPri(k)} aria-pressed={pri === k}
                  className={`pill p-${k} rounded-full px-3 py-1 text-sm font-medium ${pri === k ? 'on' : ''}`}>
                  {PRIORITY_LABEL[k]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-3 flex-wrap text-sm">
              <label className="flex items-center gap-2">
                <span style={{ color: 'var(--muted)' }}>หมวดหมู่:</span>
                <select value={newCat} onChange={(e) => setNewCat(e.target.value)}
                  className="rounded-lg px-2 py-1 bg-transparent" style={{ border: '1px solid var(--line)' }}>
                  {Object.entries(CATS).map(([k, c]) => (
                    <option key={k} value={k} style={{ color: '#111' }}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2">
                <span style={{ color: 'var(--muted)' }}>กำหนดส่ง:</span>
                <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)}
                  className="date-input rounded-lg px-2 py-1 bg-transparent" style={{ border: '1px solid var(--line)' }} />
              </label>
            </div>
          </section>

          {/* Search */}
          <div className="relative mb-3">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหางาน…"
              aria-label="ค้นหางาน"
              className="w-full rounded-xl pl-10 pr-4 py-2.5 card"
            />
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--line)' }} role="tablist">
            {FILTERS.map(([k, label]) => (
              <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
                className="flex-1 rounded-lg py-2 text-sm font-semibold transition-colors"
                style={filter === k
                  ? { background: 'var(--card)', color: 'var(--text)', boxShadow: 'var(--shadow)' }
                  : { color: 'var(--muted)' }}>
                {label}
              </button>
            ))}
          </div>

          {/* List */}
          <div>
            {shown.length === 0 && (
              <div className="card p-8 text-center" style={{ color: 'var(--muted)' }}>
                {q ? 'ไม่พบงานที่ค้นหา'
                  : filter === 'done' ? 'ยังไม่มีงานที่เสร็จ'
                  : filter === 'active' ? 'ไม่มีงานค้าง เยี่ยมมาก!'
                  : 'ยังไม่มีงานในหมวดนี้ เพิ่มงานแรกด้านบนได้เลย'}
              </div>
            )}

            {shown.map((t) => {
              const { label: catLabel, Icon: CatIcon } = CATS[t.cat]
              return (
                <div key={t.id} className={`row${t.gone ? ' gone' : ''}`} style={{ maxHeight: 150, paddingBottom: 8 }}>
                  <div className="card flex items-start gap-3 px-4 py-3">
                    <button role="checkbox" aria-checked={t.done} aria-label="ทำเสร็จแล้ว" onClick={() => patch(t.id, { done: !t.done })}
                      className="shrink-0 w-6 h-6 mt-0.5 rounded-md flex items-center justify-center transition-colors"
                      style={t.done
                        ? { background: 'var(--accent)', color: 'var(--accent-fg)', border: '2px solid var(--accent)' }
                        : { border: '2px solid var(--muted)' }}>
                      {t.done && <Check size={14} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editId === t.id ? (
                        <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditId(null) }}
                          aria-label="แก้ไขงาน"
                          className="w-full rounded-lg px-2 py-1 bg-transparent"
                          style={{ border: '1px solid var(--accent)' }} />
                      ) : (
                        <div onDoubleClick={() => { setEditId(t.id); setEditText(t.text) }}
                          title="ดับเบิลคลิกเพื่อแก้ไข"
                          className="break-words cursor-text select-none"
                          style={t.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>
                          {t.text}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <button onClick={() => patch(t.id, { pri: NEXT_PRIORITY[t.pri] })}
                          title="กดเพื่อเปลี่ยนความสำคัญ"
                          className={`p-${t.pri} rounded-full px-2.5 py-0.5 text-xs font-semibold`}>
                          {PRIORITY_LABEL[t.pri]}
                        </button>
                        <span className="tag inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                          <CatIcon size={12} />{catLabel}
                        </span>
                        <DueBadge todo={t} today={today} onChange={(due) => patch(t.id, { due })} />
                      </div>
                    </div>

                    <button onClick={() => removeIds([t.id])} aria-label="ลบงาน"
                      className="shrink-0 p-1.5 rounded-lg hover:text-red-500 transition-colors"
                      style={{ color: 'var(--muted)' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 text-sm" style={{ color: 'var(--muted)' }}>
            <span>เหลืออีก {remaining} งาน</span>
            <button onClick={() => removeIds(live.filter((t) => t.done).map((t) => t.id))}
              disabled={!doneCount} className="font-semibold disabled:opacity-40" style={{ color: 'var(--accent)' }}>
              ล้างที่เสร็จแล้ว{doneCount ? ` (${doneCount})` : ''}
            </button>
          </div>
          <p className="mt-6 text-xs text-center" style={{ color: 'var(--muted)' }}>
            ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · กดป้ายความสำคัญหรือวันที่เพื่อเปลี่ยน
          </p>
        </main>
      </div>
    </div>
  )
}
