import { Trash2, Share2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatTime } from '../lib/audioConverter'

function formatTimestamp(start, end) {
  if (start === null || start === undefined) return ''
  if (end !== null && end !== undefined) return `${formatTime(start)} 〜 ${formatTime(end)}`
  return formatTime(start)
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function CommentList({ comments, onDelete, onSeek }) {
  const handleDelete = async (id) => {
    if (!confirm('このコメントを削除しますか?')) return
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (!error) onDelete?.(id)
  }

  const shareComment = (comment) => {
    const ts = formatTimestamp(comment.timestamp_start, comment.timestamp_end)
    const text = `[${ts}] ${comment.member_name}: ${comment.content}`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => alert('コピーしました'))
    }
  }

  if (comments.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <p className="text-slate-500 text-sm">まだコメントはありません</p>
      </div>
    )
  }

  const sorted = [...comments].sort((a, b) => {
    const as = a.timestamp_start ?? Infinity
    const bs = b.timestamp_start ?? Infinity
    return as - bs
  })

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
      {sorted.map((c) => (
        <div
          key={c.id}
          className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              {/* タイムスタンプ（ク㢏ックでシーク） */}
              {(c.timestamp_start !== null && c.timestamp_start !== undefined) && (
                <button
                  onClick={() => onSeek?.(c.timestamp_start)}
                  className="flex-shrink-0 text-xs font-mono bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded hover:bg-purple-700 transition-colors"
                >
                  {formatTimestamp(c.timestamp_start, c.timestamp_end)}
                </button>
              )}
              <span className="text-xs font-semibold text-slate-300 truncate">
                {c.member_name}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => shareComment(c)}
                className="text-slate-500 hover:text-slate-300 p-1 transition-colors"
                title="共有"
              >
                <Share2 size={13} />
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                title="削除"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {c.content}
          </p>
          <p className="text-xs text-slate-600 mt-1">{formatDate(c.created_at)}</p>
        </div>
      ))}
    </div>
  )
}
