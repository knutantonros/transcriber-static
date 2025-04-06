/**
 * Storage module for managing local storage and IndexedDB operations
 */
class AppStorage {
    constructor() {
        this.dbName = 'TranscriptionAppDB';
        this.dbVersion = 1;
        this.db = null;
        this.initDB();
    }

    /**
     * Initialize IndexedDB for storing audio files and transcription results
     */
    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Failed to open database:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('audioFiles')) {
                    const audioStore = db.createObjectStore('audioFiles', { keyPath: 'id' });
                    audioStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!db.objectStoreNames.contains('transcriptions')) {
                    const transcriptionStore = db.createObjectStore('transcriptions', { keyPath: 'id' });
                    transcriptionStore.createIndex('audioId', 'audioId', { unique: false });
                    transcriptionStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * Save API key to local storage
     * @param {string} apiKey - OpenAI API key
     */
    saveApiKey(apiKey) {
        // Simple encryption for API key (not highly secure but better than plaintext)
        const encryptedKey = btoa(apiKey);
        localStorage.setItem(CONFIG.storage.apiKey, encryptedKey);
    }

    /**
     * Get API key from local storage
     * @returns {string|null} - API key or null if not found
     */
    getApiKey() {
        const encryptedKey = localStorage.getItem(CONFIG.storage.apiKey);
        if (!encryptedKey) return null;
        return atob(encryptedKey);
    }

    /**
     * Save user preferences to local storage
     * @param {Object} preferences - User preferences
     */
    savePreferences(preferences) {
        if (preferences.model) {
            localStorage.setItem(CONFIG.storage.model, preferences.model);
        }
        if (preferences.summaryLength) {
            localStorage.setItem(CONFIG.storage.summaryLength, preferences.summaryLength);
        }
        if (preferences.language) {
            localStorage.setItem(CONFIG.storage.language, preferences.language);
        }
    }

    /**
     * Get user preferences from local storage
     * @returns {Object} - User preferences
     */
    getPreferences() {
        return {
            model: localStorage.getItem(CONFIG.storage.model) || 'whisper-small',
            summaryLength: localStorage.getItem(CONFIG.storage.summaryLength) || '3',
            language: localStorage.getItem(CONFIG.storage.language) || 'sv'
        };
    }

    /**
     * Save audio file to IndexedDB
     * @param {Object} audioData - Audio file data
     * @returns {Promise<string>} - ID of saved file
     */
    async saveAudioFile(audioData) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioFiles'], 'readwrite');
            const store = transaction.objectStore('audioFiles');
            
            const id = crypto.randomUUID();
            const record = {
                id,
                name: audioData.name,
                type: audioData.type,
                blob: audioData.blob,
                duration: audioData.duration || 0,
                timestamp: Date.now()
            };
            
            const request = store.add(record);
            
            request.onsuccess = () => {
                // Update recent files list
                this.updateRecentFiles(id, audioData.name);
                resolve(id);
            };
            
            request.onerror = (event) => {
                console.error('Error saving audio file:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Update list of recent files
     * @param {string} id - File ID
     * @param {string} name - File name
     */
    updateRecentFiles(id, name) {
        let recentFiles = JSON.parse(localStorage.getItem(CONFIG.storage.recentFiles) || '[]');
        
        // Add new file to beginning of list
        recentFiles.unshift({ id, name, timestamp: Date.now() });
        
        // Keep only last 10 files
        if (recentFiles.length > 10) {
            recentFiles = recentFiles.slice(0, 10);
        }
        
        localStorage.setItem(CONFIG.storage.recentFiles, JSON.stringify(recentFiles));
    }

    /**
     * Get audio file from IndexedDB
     * @param {string} id - File ID
     * @returns {Promise<Object>} - Audio file data
     */
    async getAudioFile(id) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioFiles'], 'readonly');
            const store = transaction.objectStore('audioFiles');
            const request = store.get(id);
            
            request.onsuccess = (event) => {
                if (event.target.result) {
                    resolve(event.target.result);
                } else {
                    reject(new Error('File not found'));
                }
            };
            
            request.onerror = (event) => {
                console.error('Error retrieving audio file:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Save transcription and summary to IndexedDB
     * @param {Object} data - Transcription and summary data
     * @returns {Promise<string>} - ID of saved transcription
     */
    async saveTranscription(data) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transcriptions'], 'readwrite');
            const store = transaction.objectStore('transcriptions');
            
            const id = crypto.randomUUID();
            const record = {
                id,
                audioId: data.audioId,
                fileName: data.fileName,
                transcription: data.transcription,
                summary: data.summary,
                model: data.model,
                language: data.language,
                timestamp: Date.now()
            };
            
            const request = store.add(record);
            
            request.onsuccess = () => {
                resolve(id);
            };
            
            request.onerror = (event) => {
                console.error('Error saving transcription:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Get transcription from IndexedDB
     * @param {string} id - Transcription ID
     * @returns {Promise<Object>} - Transcription data
     */
    async getTranscription(id) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transcriptions'], 'readonly');
            const store = transaction.objectStore('transcriptions');
            const request = store.get(id);
            
            request.onsuccess = (event) => {
                if (event.target.result) {
                    resolve(event.target.result);
                } else {
                    reject(new Error('Transcription not found'));
                }
            };
            
            request.onerror = (event) => {
                console.error('Error retrieving transcription:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Get transcription by audio ID
     * @param {string} audioId - Audio file ID
     * @returns {Promise<Object>} - Transcription data
     */
    async getTranscriptionByAudioId(audioId) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transcriptions'], 'readonly');
            const store = transaction.objectStore('transcriptions');
            const index = store.index('audioId');
            const request = index.get(audioId);
            
            request.onsuccess = (event) => {
                if (event.target.result) {
                    resolve(event.target.result);
                } else {
                    resolve(null); // No transcription found
                }
            };
            
            request.onerror = (event) => {
                console.error('Error retrieving transcription:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Delete audio file and its transcription
     * @param {string} id - Audio file ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteAudioFile(id) {
        if (!this.db) await this.initDB();

        // Delete transcription first
        await this.deleteTranscriptionsByAudioId(id);

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['audioFiles'], 'readwrite');
            const store = transaction.objectStore('audioFiles');
            const request = store.delete(id);
            
            request.onsuccess = () => {
                // Update recent files list
                this.removeFromRecentFiles(id);
                resolve(true);
            };
            
            request.onerror = (event) => {
                console.error('Error deleting audio file:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Delete transcriptions by audio ID
     * @param {string} audioId - Audio file ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteTranscriptionsByAudioId(audioId) {
        if (!this.db) await this.initDB();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transcriptions'], 'readwrite');
            const store = transaction.objectStore('transcriptions');
            const index = store.index('audioId');
            const request = index.openCursor(IDBKeyRange.only(audioId));
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve(true);
                }
            };
            
            request.onerror = (event) => {
                console.error('Error deleting transcriptions:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * Remove file from recent files list
     * @param {string} id - File ID
     */
    removeFromRecentFiles(id) {
        let recentFiles = JSON.parse(localStorage.getItem(CONFIG.storage.recentFiles) || '[]');
        recentFiles = recentFiles.filter(file => file.id !== id);
        localStorage.setItem(CONFIG.storage.recentFiles, JSON.stringify(recentFiles));
    }

    /**
     * Get list of recent files
     * @returns {Array} - Recent files list
     */
    getRecentFiles() {
        return JSON.parse(localStorage.getItem(CONFIG.storage.recentFiles) || '[]');
    }
}
