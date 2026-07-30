import { useRef, useState } from 'react'
import { Upload, Plus, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { convertWavToMp3 } from '../lib/audioConverter'

export default function VersionManager({ trackId, versions, selectedVersion, onVersionSelect, onVersionAdded }) {
  const fileInputRef = useRef(null)
  const [versionLabel, setVersionLabel] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [error, setError] = useState('')

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !versionLabel.trim()) return
    if (!trackId) { setError('先にトラックを選択してください'); return }

    const isWav = /\.wav$/i.test(file.name) || file.type === 'audio/wav' || file.type === 'audio/x-wav' || file.type === 'audio/wave'
    const isMp3 = /\.mp3$/i.test(file.name) || file.type === 'audio/mpeg' || file.type === 'audio/mp3'

    if (!isWav && !isMp3) {
      setError('MP3またはWAVファイルを選択してください')
      fileInputRef.current.value = ''
      return
    }

    // WAVの場合、大容量ファイルは変換が重くなるため警告
    if (isWav && file.size > 50 * 1024 * 1024) {
      setError(`ファイルが大きすぎます（${(file.size / 1024 / 1024).toFixed(0)}MB）。スマホでは50MB以下を推奨します。`)
      fileInputRef.current.value = ''
      return
    }

    setError('')
    setUploading(true)

    try {
      let uploadFile = file

      if (isWav) {
        setUploadProgress('WAV → MP3 変換中... (しばらくお待ちください)')
        uploadFile = await convertWavToMp3(file)
      }

      setUploadProgress('アップロード中...')
      const ext = uploadFile.name.split('.').pop()
      const path = `${trackId}/${Date.now()}_${versionLabel.replace(/\s/g, '_')}.${ext}`

      const { error: storageErr } = await supabase.storage
        .from('audio-files')
        .upload(path, uploadFile, { contentType: 'audio/mpeg', upsert: false })

      if (storageErr) throw storageErr

      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(path)

      const { data, error: dbErr } = await supabase
        .from('versions')
        .insert({
          track_id: trackId,
          version_label: versionLabel.trim(),
          file_url: urlData.publicUrl,
          storage_path: path,
        })
        .select()
        .single()

      if (dbErr) throw dbErr

      onVersionAdded?.(data)
      setVersionLabel('')
      setShowUploadForm(false)
      fileInputRef.current.value = ''
    } catch (err) {
      setError(err.message || 'アップロードに失敗しました')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-300">バージョン</h2>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          disabled={!trackId}
          className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 disabled:opacity-40 transition-colors"
        >
          <Plus size={14} />
          追加
        </button>
      </div>

      {/* バージョンタブ */}
      {versions.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-2">
          {versions.map((v) => (
            <button
              key={v.id}
              onClick={() => onVersionSelect(v)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                selectedVersion?.id === v.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {v.version_label}
            </button>
          ))}
        </div>
      )}

      {/* アップロードフォーム */}
      {showUploadForm && (
        <div className="mt-2 p-3 bg-slate-700/50 rounded-lg space-y-2">
          <input
            type="text"
            placeholder="バージョン名 (例: Ver.1.1)"
            value={versionLabel}
            onChange={(e) => setVersionLabel(e.target.value)}
            className="w-full bg-slate-700 text-slate-100 placeholder-slate-500 rounded px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:border-purple-500"
          />
          <label className={`flex items-center justify-center gap-2 py-2 px-4 rounded text-sm cursor-pointer transition-colors ${
            versionLabel.trim()
              ? 'bg-purple-700 hover:bg-purple-600 text-white'
              : 'bg-slate-600 text-slate-400 cursor-not-allowed'
          }`}>
            {uploading ? (
              <>
                <Loader size={14} className="animate-spin" />
                {uploadProgress}
              </>
            ) : (
              <>
                <Upload size={14} />
                MP3 / WAV を選択
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave"
              onChange={handleFileUpload}
              disabled={!versionLabel.trim() || uploading}
              className="hidden"
            />
          </label>
          <p className="text-xs text-slate-500">WAVは自動でMP3に変換されます</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}

      {!trackId && (
        <p className="text-xs text-slate-500">トラックを選択してください</p>
      )}
    </div>
  )
}
