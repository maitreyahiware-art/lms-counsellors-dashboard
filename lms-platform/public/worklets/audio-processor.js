// AudioWorklet to process microphone input into 16kHz PCM 16-bit for Gemini Live API
class GeminiAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.sampleRate = 16000;
        this.bufferSize = 2048; 
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferPointer = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channelData = input[0];
        
        for (let i = 0; i < channelData.length; i++) {
            this.buffer[this.bufferPointer++] = channelData[i];
            
            if (this.bufferPointer >= this.bufferSize) {
                // We have a full buffer, convert to Int16
                const int16Buffer = new Int16Array(this.bufferSize);
                for (let j = 0; j < this.bufferSize; j++) {
                    const s = Math.max(-1, Math.min(1, this.buffer[j]));
                    int16Buffer[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                // Send to main thread
                // Note: The main thread will need to handle the actual strict downsampling if Context isn't strictly 16kHz 
                // but setting AudioContext({sampleRate: 16000}) in the main thread handles this natively in modern browsers.
                this.port.postMessage(int16Buffer);
                this.bufferPointer = 0;
            }
        }
        
        return true;
    }
}

registerProcessor('gemini-audio-processor', GeminiAudioProcessor);
