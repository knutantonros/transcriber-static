/**
 * Transcription module for handling speech recognition using Transformers.js
 */
class TranscriptionService {
    constructor() {
        this.pipeline = null;
        this.model = null;
        this.isLoading = false;
        this.abortController = null;
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
                'whisper-tiny': 'KBLab/kb-whisper-tiny',
                'whisper-base': 'KBLab/kb-whisper-base',
                'whisper-small': 'KBLab/kb-whisper-small',
                'whisper-medium': 'KBLab/kb-whisper-medium',
                'whisper-large': 'KBLab/kb-whisper-large'
            };

            const modelId = modelMap[modelName] || 'KBLab/kb-whisper-small';

            // Configure pipeline
            // Create a new abort controller that can be used to cancel the loading
            this.abortController = new AbortController();
            const { signal } = this.abortController;

            // Load the pipeline
            this.pipeline = await window.pipeline('automatic-speech-recognition', modelId, {
                quantized: true, // Use quantized models for better performance
                progress_callback: progressCallback,
                signal
            });

            this.model = modelName;
            this.isLoading = false;
            return true;
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Model loading was cancelled');
            } else {
                console.error('Error loading transcription model:', error);
            }
            
            this.isLoading = false;
            return false;
        }
    }

    /**
     * Cancel model loading
     */
    cancelLoading() {
        if (this.isLoading && this.abortController) {
            this.abortController.abort();
            this.isLoading = false;
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
            let audioFile = audioData;
            
            // If audioData is a URL, fetch it as a blob
            if (typeof audioData === 'string' && audioData.startsWith('blob:')) {
                const response = await fetch(audioData);
                audioFile = await response.blob();
            }

            // Configure transcription options
            const transcriptionOptions = {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: language === 'auto' ? null : language,
                task: 'transcribe'
            };

            // Set up progress tracking
            let lastProgress = 0;
            const progressHandler = (progress) => {
                // Only update if progress has changed significantly
                if (progress - lastProgress >= 0.01) {
                    lastProgress = progress;
                    if (progressCallback) {
                        progressCallback(progress);
                    }
                }
            };

            // Start transcription
            const result = await this.pipeline(audioFile, {
                ...transcriptionOptions,
                callback_function: progressHandler
            });

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
