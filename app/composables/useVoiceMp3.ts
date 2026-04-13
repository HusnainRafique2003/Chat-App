import lamejs from 'lamejs'

export async function convertToMp3(blob: Blob): Promise<File> {
  const audioContext = new AudioContext()
  
  try {
    const arrayBuffer = await blob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    // Convert to mono 44.1kHz PCM16 for MP3
    const samples = audioBuffer.length
    const sampleRate = 44100
    const pcmData = new Int16Array(samples)
    
    const channelData = audioBuffer.getChannelData(0)
    for (let i = 0; i < samples; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      pcmData[i] = sample * 32767
    }
    
    // LAME MP3 encoder
    const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128) // mono, 44.1kHz, 128kbps
    const mp3Data = []
    const sampleBlockSize = 1152 // MP3 frame size
    
    for (let i = 0; i < samples; i += sampleBlockSize) {
      const sampleChunk = pcmData.subarray(i, i + sampleBlockSize)
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk)
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf)
      }
    }
    
    // Finalize encoder
    const mp3buf = mp3encoder.flush()
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf)
    }
    
    const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' })
    return new File([mp3Blob], `voice-${Date.now()}.mp3`, { type: 'audio/mpeg' })
  } finally {
    await audioContext.close()
  }
}

