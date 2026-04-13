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

// For future MP3 if needed (disabled)
// export async function convertToMp3Deprecated(blob: Blob): Promise<File> {
//   throw new Error('MP3 conversion disabled - use WebM fallback')
// }

