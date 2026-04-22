/**
 * AudioWorklet Processor — Microphone Capture
 * Runs on a separate thread. Converts Float32 browser audio to Int16 PCM
 * suitable for Gemini Live API (16kHz, 16-bit, little-endian).
 *
 * Buffers audio into 4096-sample (~256ms) chunks before sending
 * to the main thread to avoid flooding the WebSocket.
 */
class AudioCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Int16Array(4096);
    this._bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const float32 = input[0];

    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      this._buffer[this._bufferIndex++] = s < 0 ? s * 0x8000 : s * 0x7FFF;

      if (this._bufferIndex >= this._buffer.length) {
        // Clone before transferring so we keep ownership
        const out = this._buffer.slice().buffer;
        this.port.postMessage(out, [out]);
        this._bufferIndex = 0;
      }
    }
    return true;
  }
}

registerProcessor('audio-capture-processor', AudioCaptureProcessor);
