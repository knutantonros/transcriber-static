/**
 * Audio processing module for handling recording and file manipulation
 */
class AudioProcessor {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.recordingStream = null;
        this.startTime = 0;
        this.recordingTimer = null;
        this.audioBlob = null;
        this.audioURL = null;
    }

    /**
     * Request microphone access and prepare for recording
     * @returns {Promise<boolean>} - Success status
     */
    async setupRecording() {
        try {
            this.recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            return true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            return false;
        }
    }

    /**
     * Start audio recording
     * @param {Function} onTimeUpdate - Callback for updating recording time
     * @returns {Promise<boolean>} - Success status
     */
    async startRecording(onTimeUpdate) {
        if (!this.recordingStream) {
            const setup = await this.setupRecording();
            if (!setup) return false;
        }

        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(this.recordingStream);

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.start();
        this.startTime = Date.now();

        // Update recording time
        if (onTimeUpdate) {
            this.recordingTimer = setInterval(() => {
                const elapsedTime = Date.now() - this.startTime;
                onTimeUpdate(this.formatTime(elapsedTime));
            }, 1000);
        }

        return true;
    }

    /**
     * Stop audio recording
     * @returns {Promise<Object>} - Audio data
     */
    async stopRecording() {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            return null;
        }

        return new Promise((resolve) => {
            this.mediaRecorder.onstop = () => {
                if (this.recordingTimer) {
                    clearInterval(this.recordingTimer);
                    this.recordingTimer = null;
                }

                this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.audioURL = URL.createObjectURL(this.audioBlob);

                // Get audio duration
                this.getAudioDuration(this.audioBlob).then(duration => {
                    resolve({
                        blob: this.audioBlob,
                        url: this.audioURL,
                        duration,
                        type: 'audio/webm',
                        name: `recording_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`
                    });
                });
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Stop recording stream
     */
    stopRecordingStream() {
        if (this.recordingStream) {
            this.recordingStream.getTracks().forEach(track => track.stop());
            this.recordingStream = null;
        }
    }

    /**
     * Format milliseconds to MM:SS string
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} - Formatted time string
     */
    formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    /**
     * Get audio duration from blob
     * @param {Blob} audioBlob - Audio blob
     * @returns {Promise<number>} - Duration in seconds
     */
    async getAudioDuration(audioBlob) {
        return new Promise((resolve) => {
            const audioURL = URL.createObjectURL(audioBlob);
            const audio = new Audio();
            
            audio.addEventListener('loadedmetadata', () => {
                URL.revokeObjectURL(audioURL);
                resolve(audio.duration);
            });
            
            audio.src = audioURL;
        });
    }

    /**
     * Process uploaded audio file
     * @param {File} file - Uploaded file
     * @returns {Promise<Object>} - Processed audio data
     */
    async processAudioFile(file) {
        try {
            // Convert to blob and get URL
            const blob = new Blob([await file.arrayBuffer()], { type: file.type });
            const url = URL.createObjectURL(blob);
            
            // Get duration
            const duration = await this.getAudioDuration(blob);
            
            // Handle files that are too large
            if (file.size > CONFIG.files.maxSizeMB * 1024 * 1024) {
                // In the future, we could implement client-side compression here
                // For now, just warn about file size
                console.warn('File size exceeds recommended maximum. Processing may be slow.');
            }
            
            return {
                blob,
                url,
                duration,
                type: file.type,
                name: file.name,
                size: file.size
            };
        } catch (error) {
            console.error('Error processing audio file:', error);
            throw new Error('Could not process audio file');
        }
    }

    /**
     * Clean up resources
     */
    cleanup() {
        this.stopRecordingStream();
        
        if (this.audioURL) {
            URL.revokeObjectURL(this.audioURL);
            this.audioURL = null;
        }
        
        this.audioBlob = null;
        this.audioChunks = [];
    }
}
