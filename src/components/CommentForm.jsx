import { useState, useRef } from 'react'
import { Clock, Send, Timer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatTime, parseTimeInput } from '../lib/audioConverter'

export default function CommentForm({ versionId, members, currentTime, onCommentAdded }) {
  const [text, setText] = useState('')
  const [member, setMember] = useState('')
  const [tsMode, setTsMode] = useState('single') // 'single' | 'range'
  const [tsStart, setTsStart] = useState('')
  const [tsEnd, setTsEnd] = useState('')
  const [capturedTime, setCapturedTime] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const textRef = useRef(null)

  // ãã­ã¹ãå¥åéå§æã«ç¾å¨åçæå»ãã­ã£ããã£
  const handleFocus = () => {
    if (tsMode === 'single' && capturedTime === null) {
      setCapturedTime(currentTime)
      setTsStart(formatTime(currentTime))
    }
  }

  const captureNow = (field) => {
    const t = formatTime(currentTime)
    if (field === 'start' || tsMode === 'single') {
      setCapturedTime(currentTime)
      setTsStart(t)
    } else {
      setTsEnd(t)
    }
  }

  const handleSubmit = async () => {
    if (!text.trim() || !member || !versionId) {
      setError('ã¡ã³ãã¼ã¨ã³ã¡ã³ããå¥åãã¦ãã ãã')
      return
    }
    setError('')
    setSubmitting(true)

    const startSec = parseTimeInput(tsStart)
    const endSec = tsMode === 'range' ? parseTimeInput(tsEnd) : null

    const { data, error: dbErr } = await supabase
      .from('comments')
      .insert({
        version_id: versionId,
        member_name: member,
        content: text.trim(),
        timestamp_start: startSec,
        timestamp_end: endSec,
      })
      .select()
      .single()

    setSubmitting(false)
    if (dbErr) { setError(dbErr.message); return }

    onCommentAdded?.(data)
    setText('')
    setCapturedTime(null)
    setTsStart('')
    setTsEnd('')
  }

  return (
    <div className="bg-slate-800/50 border-b border-slate-700 px-4 py-3 space-y-3">
      {/* ã¡ã³ãã¼é¸æ */}
      <div className="flex gap-2">
        <select
          value={member}
          onChange={(e) => setMember(e.target.value)}
          className="flex-1 bg-slate-700 text-slate-100 rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-purple-500"
        >
          <option value="">ã¡ã³ãã¼ãé¸æ</option>
          {members.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>

        {/* ã¿ã¤ã ã¹ã¿ã³ãã¢ã¼ãåæ¿ */}
        <div className="flex rounded overflow-hidden border border-slate-600">
          <button
            onClick={() => { setTsMode('single'); setTsEnd('') }}
            className={`px-2 py-1 text-xs transition-colors ${tsMode === 'single' ? 'bg-purple-700 text-white' : 'bg-slate-700 text-slate-400'}`}
          >
            <Clock size={13} />
          </button>
          <button
            onClick={() => setTsMode('range')}
            className={`px-2 py-1 text-xs transition-colors ${tsMode === 'range' ? 'bg-purple-700 text-white' : 'bg-slate-700 text-slate-400'}`}
          >
            <Timer size={13} />
          </button>
        </div>
      </div>

      {/* ã¿ã¤ã ã¹ã¿ã³ãå¥å */}
      <div className="flex gap-2 items-center">
        {tsMode === 'single' ? (
          <>
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                placeholder="0:00"
                value={tsStart}
                onChange={(e) => setTsStart(e.target.value)}
                className="w-16 bg-slate-700 text-slate-100 placeholder-slate-500 rounded px-2 py-1.5 text-sm border border-slate-600 focus:outline-none focus:border-purple-500 tabular-nums"
              />
              <span className="text-xs text-slate-500">ç§æ°</span>
            </div>
            <button
              onClick={() => captureNow('start')}
              className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-purple-400 px-2 py-1.5 rounded border border-slate-600 transition-colors"
            >
              <Clock size={12} />
              ç¾å¨æå»
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="0:00"
                value={tsStart}
                onChange={(e) => setTsStart(e.target.value)}
                className="w-14 bg-slate-700 text-slate-100 placeholder-slate-500 rounded px-2 py-1.5 text-sm border border-slate-600 focus:outline-none focus:border-purple-500 tabular-nums"
              />
              <button onClick={() => captureNow('start')} className="text-xs text-purple-400 hover:text-purple-300 px-1">â¶</button>
            </div>
            <span className="text-slate-500">ã</span>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="0:00"
                value={tsEnd}
                onChange={(e) => setTsEnd(e.target.value)}
                className="w-14 bg-slate-700 text-slate-100 placeholder-slate-500 rounded px-2 py-1.5 text-sm border border-slate-600 focus:outline-none focus:border-purple-500 tabular-nums"
              />
              <button onClick={() => captureNow('end')} className="text-xs text-purple-400 hover:text-purple-300 px-1">â¶</button>
            </div>
            <span className="text-xs text-slate-500">ç¯å²</span>
          </>
        )}
      </div>

      {/* ã³ã¡ã³ãå¥å */}
      <div className="flex gap-2">
        <textarea
          ref={textRef}
          rows={2}
          placeholder="ã³ã¡ã³ããå¥å... (ãã©ã¼ã«ã¹æã«åçæå»ãèªååå¾)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={handleFocus}
          className="flex-1 bg-slate-700 text-slate-100 placeholder-slate-500 rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-purple-500 resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={submitting || !text.trim() || !member}
          className="self-end px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:text-slate-400 text-white rounded transition-colors"
        >
          <Send size={18} />
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
