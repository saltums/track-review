import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { formatTime } from '../lib/audioConverter'

export default function AudioPlayer({ fileUrl, onTimeUpdate, seekRequest }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  // ãã¡ã¤ã«ãå¤ãã£ãããªã»ãã
  useEffect(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [fileUrl])

  // ã³ã¡ã³ãã¯ãªãã¯ã«ããå¤é¨ã·ã¼ã¯ï¼{ time, id } å½¢å¼ã§æ¯åæ°ãªãã¸ã§ã¯ãï¼
  useEffect(() => {
    if (!seekRequest || !audioRef.current) return
    audioRef.current.currentTime = seekRequest.time
    setCurrentTime(seekRequest.time)
    onTimeUpdate?.(seekRequest.time)
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
  }, [seekRequest])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }

  const handleTimeUpdate = () => {
    const t = audioRef.current?.currentTime ?? 0
    setCurrentTime(t)
    onTimeUpdate?.(t)
  }

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current?.duration ?? 0)
  }

  const handleEnded = () => setIsPlaying(false)

  const handleSeek = (e) => {
    const val = Number(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = val
    setCurrentTime(val)
    onTimeUpdate?.(val)
  }

  const skip = (sec) => {
    if (!audioRef.current) return
    const next = Math.max(0, Math.min(duration, currentTime + sec))
    audioRef.current.currentTime = next
    setCurrentTime(next)
    onTimeUpdate?.(next)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-slate-800 border-t border-slate-700 px-4 py-3">
      {fileUrl && (
        <audio
          ref={audioRef}
          src={fileUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}

      {/* ã·ã¼ã¯ãã¼ */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-slate-400 w-10 text-right tabular-nums">
          {formatTime(currentTime)}
        </span>
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            disabled={!fileUrl}
            className="w-full disabled:opacity-30"
            style={{
              background: `linear-gradient(to right, #a855f7 ${progress}%, #334155 ${progress}%)`,
            }}
          />
        </div>
        <span className="text-xs text-slate-400 w-10 tabular-nums">
          {formatTime(duration)}
        </span>
      </div>

      {/* ã³ã³ãã­ã¼ã« */}
      <div className="flex items-center justify-between">
        {/* ããªã¥ã¼ã  */}
        <div className="flex items-center gap-1">
          <Volume2 size={14} className="text-slate-500" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value)
              setVolume(v)
              if (audioRef.current) audioRef.current.volume = v
            }}
            className="w-16"
            style={{
              background: `linear-gradient(to right, #a855f7 ${volume * 100}%, #334155 ${volume * 100}%)`,
            }}
          />
        </div>

        {/* åçã³ã³ãã­ã¼ã« */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => skip(-10)}
            disabled={!fileUrl}
            className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors p-2"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            disabled={!fileUrl}
            className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:bg-slate-700 flex items-center justify-center transition-colors shadow-lg active:scale-95"
          >
            {isPlaying
              ? <Pause size={22} className="text-white" />
              : <Play size={22} className="text-white ml-0.5" />
            }
          </button>

          <button
            onClick={() => skip(10)}
            disabled={!fileUrl}
            className="text-slate-400 hover:text-white disabled:opacity-30 transition-colors p-2"
          >
            <SkipForward size={20} />
          </button>
        </div>

        <div className="w-20" />
      </div>

      {!fileUrl && (
        <p className="text-center text-xs text-slate-500 mt-2">
          ãã¼ã¸ã§ã³ãé¸æãããé³æºãã¢ããã­ã¼ããã¦ãã ãã
        </p>
      )}
    </div>
  )
}
