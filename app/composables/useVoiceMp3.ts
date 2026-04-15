// import { v4 as uuidv4 } from 'uuid'  // Removed uuid dependency

/**
 * Normalize voice recording blob to standard WebM File for reliable backend upload
 * - Ensures correct MIME type (audio/webm;codecs=opus)
 * - Proper filename (voice-xxx.webm)
 * - Backend-safe validation
 */
export async function normalizeVoiceBlob(blob: Blob): Promise<File> {
  // Determine best MIME type based on browser/recording
  let mimeType = 'audio/webm;codecs=opus'

  // Check if it's already perfect
  if (blob.type === 'audio/webm;codecs=opus') {
    console.log('[Voice] Blob already perfect WebM/opus')
    return new File([blob], `voice-${Date.now()}.webm`, { type: mimeType })
  }

  // Handle common recording outputs
  if (blob.type.startsWith('audio/webm')) {
    console.log('[Voice] Converting webm to standard opus')
  } else if (blob.type.startsWith('audio/ogg')) {
    console.log('[Voice] OGG → WebM fallback (rename)')
    mimeType = 'audio/webm' // Conservative fallback
  } else if (blob.type.startsWith('audio/wav') || blob.type.startsWith('audio/mp4')) {
    console.log('[Voice] WAV/MP4 → WebM (rename + type fix)')
    mimeType = 'audio/webm'
  } else {
    console.log('[Voice] Unknown audio → generic webm:', blob.type)
    mimeType = 'audio/webm'
  }

  const fileName = `voice-${Math.random().toString(36).slice(2, 10)}-${Date.now()}.webm`
  const normalizedFile = new File([blob], fileName, { type: mimeType })

  console.log('[Voice] Normalized:', {
    originalType: blob.type,
    newType: mimeType,
    size: normalizedFile.size,
    name: normalizedFile.name
  })

  return normalizedFile
}

// Legacy export compatibility
export { normalizeVoiceBlob as convertToMp3 }

// Dynamic import for lamejs (ES module + UMD compatibility)
let LameJS: any = null
async function loadLameJS() {
  if (!LameJS) {
    try {
      const lamejs = await import('lamejs')
      LameJS = lamejs.default || lamejs
      console.log('[Voice MP3] lamejs loaded successfully:', !!LameJS?.Mp3Encoder)
    } catch (error) {
      console.error('[Voice MP3] Failed to load lamejs:', error)
      LameJS = null
    }
  }
  return LameJS
}

/**
 * Convert recorded audio blob to MP3 for backend compatibility
 */
export async function recordToMp3(blob: Blob): Promise<File> {
  const LameJS = await loadLameJS()
  if (!LameJS?.Mp3Encoder) {
    console.error('[Voice MP3] lamejs failed to load, falling back to WebM')
    return normalizeVoiceBlob(blob)
  }

  const AudioContext = window.AudioContext || (window as any).webkitAudioContext
  const audioContext = new AudioContext()

  try {
    const arrayBuffer = await blob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const mp3encoder = new LameJS.Mp3Encoder(1, audioBuffer.sampleRate || 44100, 128) // mono, 128kbps
    const samples = audioBuffer.getChannelData(0)
    const sampleBlockSize = 1152 // MP3 frame size
    const mp3Data: Uint8Array[] = []

    // Encode in blocks
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, Math.min(i + sampleBlockSize, samples.length))
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk)
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf)
      }
    }

    // Flush encoder
    const mp3buf = mp3encoder.flush()
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf)
    }

    const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' })
    const file = new File([mp3Blob], `voice-${Date.now()}.mp3`, { type: 'audio/mpeg' })

    console.log('[Voice MP3] Converted successfully:', {
      inputType: blob.type,
      inputSize: blob.size,
      outputSize: file.size,
      sampleRate: audioBuffer.sampleRate,
      duration: audioBuffer.duration
    })

    return file
  } catch (error) {
    console.error('[Voice MP3] Conversion failed:', error)
    // Fallback to normalized WebM
    return normalizeVoiceBlob(blob)
  } finally {
    if (audioContext.state === 'running') {
      await audioContext.close()
    }
  }
}
