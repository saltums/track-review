import { useEffect, useState } from 'react'
import { Music, Plus, ChevronDown, Settings, X } from 'lucide-react'
import { supabase } from './lib/supabase'
import AudioPlayer from './components/AudioPlayer'
import VersionManager from './components/VersionManager'
import CommentForm from './components/CommentForm'
import CommentList from './components/CommentList'
import ShareButtons from './components/ShareButtons'

// ──────────────────────────────────────────────
// トラック選択パネル
// ──────────────────────────────────────────────
function TrackSelector({ tracks, selectedTrack, onSelect, onCreated }) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const createTrack = async () => {
    if (!newTitle.trim()) return
    const { data, error } = await supabase
      .from('tracks')
      .insert({ title: newTitle.trim() })
      .select()
      .single()
    if (!error) {
      onCreated?.(data)
      setNewTitle('')
      setCreating(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-semibold text-white"
      >
        <Music size={16} className="text-purple-400 flex-shrink-0" />
        <span className="truncate max-w-[180px]">
          {selectedTrack?.title ?? 'トラックを選択'}
        </span>
        <ChevronDown size={14} className="text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <>
          {/* オーバーレイ */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
            {tracks.map((t) => (
              <button
                key={t.id}
                onClick={() => { onSelect(t); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-700 transition-colors first:rounded-t-lg ${
                  selectedTrack?.id === t.id ? 'text-purple-400 font-medium' : 'text-slate-200'
                }`}
              >
                {t.title}
              </button>
            ))}
            <div className="border-t border-slate-700 p-2">
              {creating ? (
                <div className="flex gap-1">
                  <input
                    autoFocus
                    type="text"
                    placeholder="トラック名"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createTrack()}
                    className="flex-1 bg-slate-700 text-slate-100 rounded px-2 py-1 text-sm border border-slate-600 focus:outline-none focus:border-purple-500"
                  />
                  <button onClick={createTrack} className="text-purple-400 hover:text-purple-300 px-2">
                    ✓
                  </button>
                  <button onClick={() => setCreating(false)} className="text-slate-500 hover:text-slate-300 px-1">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 px-2 py-1"
                >
                  <Plus size={12} /> 新しいトラック
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// メンバー管理モーダル
// ──────────────────────────────────────────────
function MemberPanel({ members, onMembersChange, onClose }) {
  const [newName, setNewName] = useState('')

  const addMember = async () => {
    if (!newName.trim()) return
    const { data, error } = await supabase
      .from('members')
      .insert({ name: newName.trim() })
      .select()
      .single()
    if (!error) {
      onMembersChange([...members, data])
      setNewName('')
    }
  }

  const deleteMember = async (id) => {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (!error) onMembersChange(members.filter((m) => m.id !== id))
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-sm p-4 border border-slate-600 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-100">メンバー管理</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-1 mb-3 max-h-52 overflow-y-auto">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-slate-700 rounded">
              <span className="text-sm text-slate-200">{m.name}</span>
              <button
                onClick={() => deleteMember(m.id)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-xs text-slate-500 px-3 py-2">メンバーがいません</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="メンバー名を追加"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
            className="flex-1 bg-slate-700 text-slate-100 placeholder-slate-500 rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={addMember}
            className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// メインアプリ
// ──────────────────────────────────────────────
export default function App() {
  const [tracks, setTracks] = useState([])
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState(null)
  const [comments, setComments] = useState([])
  const [members, setMembers] = useState([])
  const [currentTime, setCurrentTime] = useState(0)
  // コメントクリック → プレイヤーシーク用のリクエスト
  const [seekRequest, setSeekRequest] = useState(null)
  const [showMemberPanel, setShowMemberPanel] = useState(false)
  const [loading, setLoading] = useState(true)

  // 初期ロード
  useEffect(() => {
    Promise.all([
      supabase.from('tracks').select('*').order('created_at', { ascending: false }),
      supabase.from('members').select('*').order('name'),
    ]).then(([tracksRes, membersRes]) => {
      setTracks(tracksRes.data ?? [])
      setMembers(membersRes.data ?? [])
      setLoading(false)
    })
  }, [])

  // トラック変更 → バージョン取得
  useEffect(() => {
    if (!selectedTrack) { setVersions([]); setSelectedVersion(null); return }
    supabase
      .from('versions')
      .select('*')
      .eq('track_id', selectedTrack.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        const list = data ?? []
        setVersions(list)
        setSelectedVersion(list[list.length - 1] ?? null)
      })
  }, [selectedTrack])

  // バージョン変更 → コメント取得
  useEffect(() => {
    if (!selectedVersion) { setComments([]); return }
    supabase
      .from('comments')
      .select('*')
      .eq('version_id', selectedVersion.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setComments(data ?? []))
  }, [selectedVersion])

  const handleSeek = (sec) => {
    // 毎回必ず useEffect を発火させるためオブジェクトでラップ
    setSeekRequest({ time: sec, id: Date.now() })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-400 text-sm animate-pulse">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 max-w-2xl mx-auto">
      {/* ヘッダー */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <TrackSelector
          tracks={tracks}
          selectedTrack={selectedTrack}
          onSelect={(t) => { setSelectedTrack(t); setSelectedVersion(null) }}
          onCreated={(t) => { setTracks([t, ...tracks]); setSelectedTrack(t) }}
        />
        <button
          onClick={() => setShowMemberPanel(true)}
          className="text-slate-400 hover:text-white p-1.5 transition-colors"
          title="メンバー管理"
        >
          <Settings size={18} />
        </button>
      </header>

      {/* バージョン管理 */}
      <VersionManager
        trackId={selectedTrack?.id}
        versions={versions}
        selectedVersion={selectedVersion}
        onVersionSelect={setSelectedVersion}
        onVersionAdded={(v) => {
          setVersions((prev) => [...prev, v])
          setSelectedVersion(v)
        }}
      />

      {/* 共有・CSV */}
      <ShareButtons
        comments={comments}
        selectedVersion={selectedVersion}
        trackTitle={selectedTrack?.title ?? 'track'}
      />

      {/* コメント入力 */}
      <CommentForm
        versionId={selectedVersion?.id}
        members={members}
        currentTime={currentTime}
        onCommentAdded={(c) => setComments((prev) => [...prev, c])}
      />

      {/* コメント一覧（スクロール） */}
      <CommentList
        comments={comments}
        onDelete={(id) => setComments((prev) => prev.filter((c) => c.id !== id))}
        onSeek={handleSeek}
      />

      {/* プレイヤー（固定下部） */}
      <div className="flex-shrink-0">
        <AudioPlayer
          fileUrl={selectedVersion?.file_url}
          onTimeUpdate={setCurrentTime}
          seekRequest={seekRequest}
        />
      </div>

      {showMemberPanel && (
        <MemberPanel
          members={members}
          onMembersChange={setMembers}
          onClose={() => setShowMemberPanel(false)}
        />
      )}
    </div>
  )
}
