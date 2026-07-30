/**
 * WAVãã¡ã¤ã«ãMP3ã«å¤æãã
 * lamejsãä½¿ç¨ãã¦ãã©ã¦ã¶ä¸ã§ã¨ã³ã³ã¼ã
 */
export async function convertWavToMp3(wavFile) {
  const lamejs = (await import('lamejs')).default

  const arrayBuffer = await wavFile.arrayBuffer()
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
  await audioCtx.close()

  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const bitRate = 128

  const encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, bitRate)
  const mp3Chunks = []
  const BLOCK = 1152

  const toInt16 = (f32) => {
    const i16 = new Int16Array(f32.length)
    for (let i = 0; i < f32.length; i++) {
      const s = Math.max(-1, Math.min(1, f32[i]))
      i16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return i16
  }

  const left = toInt16(audioBuffer.getChannelData(0))
  const right = numChannels > 1 ? toInt16(audioBuffer.getChannelData(1)) : left

  for (let i = 0; i < left.length; i += BLOCK) {
    const lChunk = left.subarray(i, i + BLOCK)
    const rChunk = right.subarray(i, i + BLOCK)
    const encoded = numChannels > 1
      ? encoder.encodeBuffer(lChunk, rChunk)
      : encoder.encodeBuffer(lChunk)
    if (encoded.length > 0) mp3Chunks.push(new Uint8Array(encoded))
  }

  const flushed = encoder.flush()
  if (flushed.length > 0) mp3Chunks.push(new Uint8Array(flushed))

  const blob = new Blob(mp3Chunks, { type: 'audio/mpeg' })
  const mp3Name = wavFile.name.replace(/\.wav$/i, '.mp3')
  return new File([blob], mp3Name, { type: 'audio/mpeg' })
}

export function formatTime(seconds) {
  if (!seconds && seconds !== 0) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function parseTimeInput(str) {
  if (!str) return null
  const match = str.match(/^(\d+):(\d{2})$/)
  if (!match) return null
  return parseInt(match[1]) * 60 + parseInt(match[2])
}
