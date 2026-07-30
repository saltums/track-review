import { Link, Download, MessageCircle } from 'lucide-react'
import { formatTime } from '../lib/audioConverter'

function formatTimestamp(start, end) {
  if (start === null || start === undefined) return ''
  if (end !== null && end !== undefined) return `${formatTime(start)}-${formatTime(end)}`
  return formatTime(start)
}

export default function ShareButtons({ comments, selectedVersion, trackTitle }) {
  const copyPageUrl = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('URLをコピーしました'))
      .catch(() => alert('コピーに失敗しました'))
  }

  const shareOnLine = () => {
    const url = encodeURIComponent(window.location.href)
    const title = encodeURIComponent(`${trackTitle} ${selectedVersion?.version_label ?? ''} のレビュー`)
    window.open(`https://line.me/R/msg/text/?${title}%0A${url}`, '_blank')
  }

  const exportCSV = () => {
    if (!comments.length) { alert('コメントがありません'); return }

    const vLabel = selectedVersion?.version_label ?? ''
    const headers = ['タイムスタンプ', 'メンバー', 'コメント', '投稿日時']
    const rows = [...comments]
      .sort((a, b) => (a.timestamp_start ?? Infinity) - (b.timestamp_start ?? Infinity))
      .map((c) => [
        formatTimestamp(c.timestamp_start, c.timestamp_end),
        c.member_name,
        c.content.replace(/"/g, '""'),
        new Date(c.created_at).toLocaleString('ja-JP'),
      ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\r\n')

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `review_${trackTitle}_${vLabel}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-700 bg-slate-800/50">
      <button
        onClick={copyPageUrl}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors"
      >
        <Link size={12} />
        URLコピー
      </button>
      <button
        onClick={shareOnLine}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors"
      >
        <MessageCircle size={12} />
        LINE
      </button>
      <button
        onClick={exportCSV}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded transition-colors ml-auto"
      >
        <Download size={12} />
        CSV出力
      </button>
    </div>
  )
}
