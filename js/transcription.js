/**
 * Simplified transcription module based on whisper-web implementation
 */
class TranscriptionService {
    constructor() {
        this.pipeline = null;
        this.model = null;
        this.isLoading = false;
    }

    async loadModel(modelName, progressCallback) {
        if (this.isLoading) return false;
        
        this.isLoading = true;
        
        try {
            // Map to correct model ID
            const modelMap = {
                'whisper-tiny': 'Xenova/whisper-tiny',  // Use Xenova models which are more reliable
                'whisper-base': 'Xenova/whisper-base',  // Than trying to use KB models directly
                'whisper-small': 'Xenova/whisper-small',
                'whisper-medium': 'Xenova/whisper-medium',
                'whisper-large': 'Xenova/whisper-large-v2'
            };
            
            const modelId = modelMap[modelName] || 'Xenova/whisper-tiny';
            
            // Import pipeline using dynamic import
            const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.8.0');
            
            // Simple progress tracking
            const onProgress = progress => {
                if (progressCallback) {
                    progressCallback(progress.progress);
                }
            };
            
            // Load model with simplified options
            this.pipeline = await pipeline('automatic-speech-recognition', modelId, {
                progress_callback: onProgress,
                quantized: true
            });
            
            this.model = modelName;
            this.isLoading = false;
            return true;
        } catch (error) {
            console.error('Error loading model:', error);
            this.isLoading = false;
            return false;
        }
    }

    async transcribe(audioData, language, progressCallback) {
        if (!this.pipeline) {
            throw new Error('Transcription model not loaded');
        }

        try {
            // Simplified transcription with minimal options
            const result = await this.pipeline(audioData, {
                language: language === 'auto' ? null : language,
                task: 'transcribe',
                callback_function: progress => {
                    if (progressCallback) {
                        progressCallback(progress);
                    }
                }
            });

            return result.text;
        } catch (error) {
            console.error('Transcription error:', error);
            throw new Error('Failed to transcribe audio: ' + error.message);
        }
    }

    isModelLoaded(modelName) {
        return this.model === modelName && this.pipeline !== null;
    }
}
