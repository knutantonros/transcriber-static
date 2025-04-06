/**
 * UI module for handling user interface interactions
 */
class UI {
    constructor() {
        // Tabs
        this.uploadTab = document.getElementById('upload');
        this.recordTab = document.getElementById('record');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        
        // Settings panel
        this.apiKeyInput = document.getElementById('api-key');
        this.modelSelect = document.getElementById('model-select');
        this.summaryLengthSlider = document.getElementById('summary-length');
        this.languageSelect = document.getElementById('language-select');
        this.toggleSettingsBtn = document.getElementById('toggle-settings');
        this.settingsContent = document.querySelector('.settings-content');
        
        // File upload
        this.dropArea = document.getElementById('drop-area');
        this.fileInput = document.getElementById('file-input');
        this.selectFileBtn = document.getElementById('select-file-btn');
        this.processFileBtn = document.getElementById('process-file-btn');
        this.removeFileBtn = document.getElementById('remove-file-btn');
        this.fileInfo = document.querySelector('.file-info');
        this.filename = document.getElementById('filename');
        
        // Recording
        this.startRecordBtn = document.getElementById('start-record-btn');
        this.stopRecordBtn = document.getElementById('stop-record-btn');
        this.recordingIndicator = document.getElementById('recording-indicator');
        this.recordingTime = document.getElementById('recording-time');
        this.audioPlayer = document.getElementById('audio-player');
        this.audioPlayerContainer = document.getElementById('audio-player-container');
        this.processRecordingBtn = document.getElementById('process-recording-btn');
        this.discardRecordingBtn = document.getElementById('discard-recording-btn');
        
        // Processing
        this.processingSection = document.getElementById('processing-section');
        this.processingStage = document.getElementById('processing-stage');
        this.progressFill = document.getElementById('progress-fill');
        this.processingInfo = document.getElementById('processing-info');
        
        // Results
        this.resultsSection = document.getElementById('results-section');
        this.resultsTabs = document.querySelectorAll('.results-tab-btn');
        this.transcriptionResult = document.getElementById('transcription-result');
        this.summaryResult = document.getElementById('summary-result');
        this.transcriptionText = document.getElementById('transcription-text');
        this.summaryText = document.getElementById('summary-text');
        
        // Download buttons
        this.copyTranscriptionBtn = document.getElementById('copy-transcription');
        this.downloadTranscriptionTxtBtn = document.getElementById('download-transcription-txt');
        this.downloadTranscriptionDocxBtn = document.getElementById('download-transcription-docx');
        this.copySummaryBtn = document.getElementById('copy-summary');
        this.downloadSummaryTxtBtn = document.getElementById('download-summary-txt');
        
        // Initialize event listeners
        this.initEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Tab switching
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });
        
        // Settings toggle
        this.toggleSettingsBtn.addEventListener('click', () => {
            this.toggleSettings();
        });
        
        // File upload via button
        this.selectFileBtn.addEventListener('click', () => {
            this.fileInput.click();
        });
        
        // File upload change handler
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelected(e.target.files[0]);
            }
        });
        
        // Drag and drop handlers
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });
        
        this.dropArea.addEventListener('dragenter', () => {
            this.dropArea.classList.add('highlight');
        }, false);
        
        this.dropArea.addEventListener('dragleave', () => {
            this.dropArea.classList.remove('highlight');
        }, false);
        
        this.dropArea.addEventListener('drop', (e) => {
            this.dropArea.classList.remove('highlight');
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelected(e.dataTransfer.files[0]);
            }
        }, false);
        
        // Remove file button
        this.removeFileBtn.addEventListener('click', () => {
            this.resetFileUpload();
        });
        
        // Recording buttons
        this.startRecordBtn.addEventListener('click', () => {
            this.prepareToRecord();
        });
        
        this.stopRecordBtn.addEventListener('click', () => {
            this.stopRecording();
        });
        
        this.discardRecordingBtn.addEventListener('click', () => {
            this.resetRecording();
        });
        
        // Results tabs
        this.resultsTabs.forEach(button => {
            button.addEventListener('click', () => {
                this.switchResultsTab(button.dataset.result);
            });
        });
        
        // Copy buttons
        this.copyTranscriptionBtn.addEventListener('click', () => {
            this.copyToClipboard(this.transcriptionText.textContent);
        });
        
        this.copySummaryBtn.addEventListener('click', () => {
            this.copyToClipboard(this.summaryText.textContent);
        });
    }

    /**
     * Switch between tabs
     * @param {string} tabId - ID of tab to switch to
     */
    switchTab(tabId) {
        // Update tab buttons
        this.tabButtons.forEach(button => {
            if (button.dataset.tab === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update tab content
        if (tabId === 'upload') {
            this.uploadTab.classList.add('active');
            this.recordTab.classList.remove('active');
        } else if (tabId === 'record') {
            this.uploadTab.classList.remove('active');
            this.recordTab.classList.add('active');
        }
    }

    /**
     * Toggle settings panel visibility
     */
    toggleSettings() {
        const isExpanded = this.settingsContent.style.display !== 'none';
        
        if (isExpanded) {
            this.settingsContent.style.display = 'none';
            this.toggleSettingsBtn.innerHTML = '<i class="fas fa-cog"></i>';
        } else {
            this.settingsContent.style.display = 'block';
            this.toggleSettingsBtn.innerHTML = '<i class="fas fa-times"></i>';
        }
    }

    /**
     * Handle file selection
     * @param {File} file - Selected file
     */
    handleFileSelected(file) {
        // Check if file is audio or video
        const fileType = file.type.split('/')[0];
        if (fileType !== 'audio' && fileType !== 'video') {
            alert('Vänligen välj en ljud- eller videofil.');
            return;
        }
        
        // Update UI
        this.filename.textContent = file.name;
        this.fileInfo.style.display = 'block';
        document.querySelector('.upload-message').style.display = 'none';
        
        // Store file for later processing
        this.selectedFile = file;
    }

    /**
     * Reset file upload UI
     */
    resetFileUpload() {
        this.fileInput.value = '';
        this.filename.textContent = '';
        this.fileInfo.style.display = 'none';
        document.querySelector('.upload-message').style.display = 'block';
        this.selectedFile = null;
    }

    /**
     * Prepare to record audio
     */
    prepareToRecord() {
        this.startRecordBtn.style.display = 'none';
        this.stopRecordBtn.style.display = 'inline-block';
        this.recordingIndicator.style.display = 'block';
        this.recordingTime.textContent = '00:00';
        this.audioPlayerContainer.style.display = 'none';
    }

    /**
     * Update recording time
     * @param {string} time - Formatted time string
     */
    updateRecordingTime(time) {
        this.recordingTime.textContent = time;
    }

    /**
     * Stop recording and show audio player
     * @param {string} audioUrl - URL of recorded audio
     */
    stopRecording() {
        this.startRecordBtn.style.display = 'inline-block';
        this.stopRecordBtn.style.display = 'none';
        this.recordingIndicator.style.display = 'none';
        this.audioPlayerContainer.style.display = 'block';
    }

    /**
     * Set audio player source
     * @param {string} audioUrl - URL of audio
     */
    setAudioSource(audioUrl) {
        this.audioPlayer.src = audioUrl;
        this.audioPlayer.style.display = 'block';
    }

    /**
     * Reset recording UI
     */
    resetRecording() {
        this.startRecordBtn.style.display = 'inline-block';
        this.stopRecordBtn.style.display = 'none';
        this.recordingIndicator.style.display = 'none';
        this.audioPlayerContainer.style.display = 'none';
        this.audioPlayer.src = '';
    }

    /**
     * Show processing UI
     * @param {string} stage - Current processing stage
     */
    showProcessing(stage) {
        this.processingSection.style.display = 'block';
        this.processingStage.textContent = stage;
        this.progressFill.style.width = '0%';
        this.resultsSection.style.display = 'none';
    }

    /**
     * Update progress bar
     * @param {number} progress - Progress percentage (0-1)
     */
    updateProgress(progress) {
        const percent = Math.min(Math.max(progress * 100, 0), 100);
        this.progressFill.style.width = `${percent}%`;
    }

    /**
     * Update processing info
     * @param {string} info - Processing information
     */
    updateProcessingInfo(info) {
        this.processingInfo.textContent = info;
    }

    /**
     * Hide processing UI
     */
    hideProcessing() {
        this.processingSection.style.display = 'none';
    }

    /**
     * Show results UI
     * @param {string} transcription - Transcribed text
     * @param {string} summary - Summarized text
     */
    showResults(transcription, summary) {
        this.transcriptionText.textContent = transcription;
        this.summaryText.textContent = summary || 'Ingen sammanfattning tillgänglig. Ange en OpenAI API-nyckel i inställningarna för att aktivera sammanfattningar.';
        
        this.resultsSection.style.display = 'block';
        this.switchResultsTab('transcription');
    }

    /**
     * Switch between results tabs
     * @param {string} tabId - ID of tab to switch to
     */
    switchResultsTab(tabId) {
        // Update tab buttons
        this.resultsTabs.forEach(button => {
            if (button.dataset.result === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update tab content
        if (tabId === 'transcription') {
            this.transcriptionResult.classList.add('active');
            this.summaryResult.classList.remove('active');
        } else if (tabId === 'summary') {
            this.transcriptionResult.classList.remove('active');
            this.summaryResult.classList.add('active');
        }
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Kopierat till urklipp!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    /**
     * Download text as file
     * @param {string} text - Text content
     * @param {string} filename - File name
     */
    downloadTextFile(text, filename) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Download as Word document
     * @param {string} text - Text content
     * @param {string} filename - File name
     */
    downloadWordDocument(text, filename) {
        // Using docx.js library
        const doc = new docx.Document({
            sections: [{
                properties: {},
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun(text)
                        ]
                    })
                ]
            }]
        });

        docx.Packer.toBlob(doc).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    /**
     * Get current settings
     * @returns {Object} - Current settings
     */
    getSettings() {
        return {
            apiKey: this.apiKeyInput.value,
            model: this.modelSelect.value,
            summaryLength: this.summaryLengthSlider.value,
            language: this.languageSelect.value
        };
    }

    /**
     * Set settings values
     * @param {Object} settings - Settings to set
     */
    setSettings(settings) {
        if (settings.apiKey) {
            this.apiKeyInput.value = settings.apiKey;
        }
        
        if (settings.model) {
            this.modelSelect.value = settings.model;
        }
        
        if (settings.summaryLength) {
            this.summaryLengthSlider.value = settings.summaryLength;
        }
        
        if (settings.language) {
            this.languageSelect.value = settings.language;
        }
    }
}
