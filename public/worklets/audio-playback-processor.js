/**
 * AudioWorklet Processor — Speaker Playback
 * Receives Int16 PCM buffers from the main thread (Gemini's 24kHz output),
 * converts to Float32, and writes to the speaker output buffer.
 */
class AudioPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(0);
    this.port.onmessage = (event) => {
      if (event.data === 'clear') {
        // Barge-in: user interrupted, clear the playback queue
        this._buffer = new Float32Array(0);
        return;
      }
      // Receive Int16 PCM data and convert to Float32
      const int16 = new Int16Array(event.data);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / (int16[i] < 0 ? 0x8000 : 0x7FFF);
      }
      // Append to buffer
      const newBuffer = new Float32Array(this._buffer.length + float32.length);
      newBuffer.set(this._buffer, 0);
      newBuffer.set(float32, this._buffer.length);
      this._buffer = newBuffer;
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    if (output && output.length > 0) {
      const channel = output[0];
      const samplesToWrite = Math.min(channel.length, this._buffer.length);

      if (samplesToWrite > 0) {
        channel.set(this._buffer.subarray(0, samplesToWrite));
        this._buffer = this._buffer.subarray(samplesToWrite);
      }
      // Remaining samples in channel stay 0 (silence)
    }
    return true;
  }
}

registerProcessor('audio-playback-processor', AudioPlaybackProcessor);
