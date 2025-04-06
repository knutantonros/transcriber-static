/**
 * Transcription module for handling speech recognition using Transformers.js
 */
class TranscriptionService {
    constructor() {
        this.pipeline = null;
        this.model = null;
        this.isLoading = false;
    }

    /**
     * Load transcription model
     * @param {string} modelName - Name of the model to load
     * @param {Function} progressCallback - Callback for loading progress
     * @returns {Promise<boolean>} - Success status
     */
    async loadModel(modelName, progressCallback) {
        if (this.isLoading) {
            return false;
        }

        this.isLoading = true;

        try {
            // Map model name to Hugging Face model ID
            const modelMap = {
                'whisper-tiny': 'Xenova/whisper-tiny',
                'whisper-base': 'Xenova/whisper-base',
                'whisper-small': 'Xenova/whisper-small',
                'whisper-medium': 'Xenova/whisper-medium',
                'whisper-large': 'Xenova/whisper-large-v2'
            };

            const modelId = modelMap[modelName] || 'Xenova/whisper-small';

            // Import directly from CDN
            const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.8.0/dist/transformers.min.js');
            
            // Load the pipeline with progress tracking
            this.pipeline = await pipeline('automatic-speech-recognition', modelId, {
                quantized: true,
                progress_callback: progressCallback
            });

            this.model = modelName;
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('Error loading transcription model:', error);
            this.isLoading = false;
            return false;
        }
    }

    /**
     * Transcribe audio
     * @param {Blob|string} audioData - Audio blob or URL
     * @param {string} language - Language code
     * @param {Function} progressCallback - Callback for transcription progress
     * @returns {Promise<string>} - Transcribed text
     */
    async transcribe(audioData, language, progressCallback) {
        if (!this.pipeline) {
            throw new Error('Transcription model not loaded');
        }

        try {
            // Import required modules
            const { AutoProcessor } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.8.0/dist/transformers.min.js');

            // Convert audio to the expected format
            let audioArrayBuffer;
            
            if (audioData instanceof Blob) {
                // Convert Blob to ArrayBuffer
                audioArrayBuffer = await audioData.arrayBuffer();
            } else if (typeof audioData === 'string' && audioData.startsWith('blob:')) {
                // Fetch URL and get ArrayBuffer
                const response = await fetch(audioData);
                const blob = await response.blob();
                audioArrayBuffer = await blob.arrayBuffer();
            } else {
                throw new Error('Unsupported audio data format');
            }

            // Create audio context and decode audio
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
            
            // Get audio data and convert to Float32Array
            const audioChannelData = audioBuffer.getChannelData(0); // Get first channel
            
            // Configure transcription options
            const transcriptionOptions = {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: language === 'auto' ? null : language,
                task: 'transcribe',
                callback_function: progressCallback
            };

            // Start transcription with the processed audio data
            const result = await this.pipeline(audioChannelData, transcriptionOptions);

            return result.text;
        } catch (error) {
            console.error('Transcription error:', error);
            throw new Error('Failed to transcribe audio: ' + error.message);
        }
    }

    /**
     * Check if model is loaded
     * @param {string} modelName - Name of the model to check
     * @returns {boolean} - Whether model is loaded
     */
    isModelLoaded(modelName) {
        return this.model === modelName && this.pipeline !== null;
    }
}
