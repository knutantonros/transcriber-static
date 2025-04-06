/**
 * Main application logic
 */
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI();
    const storage = new AppStorage();
    const audioProcessor = new AudioProcessor();
    const transcriptionService = new TranscriptionService();
    const summarizationService = new SummarizationService();
    
    let currentAudioData = null;
    
    // Initialize settings from local storage
    const savedSettings = storage.getPreferences();
    ui.setSettings(savedSettings);
    
    // Set API key from local storage if available
    const savedApiKey = storage.getApiKey();
    if (savedApiKey) {
        ui.apiKeyInput.value = savedApiKey;
        summarizationService.setApiKey(savedApiKey);
    }
    
    // Save settings when changed
    ui.apiKeyInput.addEventListener('change', () => {
        const apiKey = ui.apiKeyInput.value;
        storage.saveApiKey(apiKey);
        summarizationService.setApiKey(apiKey);
    });
    
    ui.modelSelect.addEventListener('change', () => {
        storage.savePreferences({ model: ui.modelSelect.value });
    });
    
    ui.summaryLengthSlider.addEventListener('change', () => {
        storage.savePreferences({ summaryLength: ui.summaryLengthSlider.value });
    });
    
    ui.languageSelect.addEventListener('change', () => {
        storage.savePreferences({ language: ui.languageSelect.value });
    });
    
    // Process uploaded file
    ui.processFileBtn.addEventListener('click', async () => {
        if (!ui.selectedFile) {
            alert('Vänligen välj en fil först.');
            return;
        }
        
        try {
            ui.showProcessing('Förbereder ljud...');
            ui.updateProcessingInfo('Detta kan ta en stund beroende på filens storlek.');
            
            // Process audio file
            const audioData = await audioProcessor.processAudioFile(ui.selectedFile);
            currentAudioData = audioData;
            
            // Save to storage
            const audioId = await storage.saveAudioFile({
                name: audioData.name,
                type: audioData.type,
                blob: audioData.blob,
                duration: audioData.duration
            });
            
            // Start transcription process
            await processAudio(audioData, audioId);
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Ett fel uppstod vid bearbetning av filen: ' + error.message);
            ui.hideProcessing();
        }
    });
    
    // Process recording
    ui.processRecordingBtn.addEventListener('click', async () => {
        if (!currentAudioData) {
            alert('Ingen inspelning tillgänglig.');
            return;
        }
        
        try {
            ui.showProcessing('Förbereder ljud...');
            
            // Save to storage
            const audioId = await storage.saveAudioFile({
                name: currentAudioData.name,
                type: currentAudioData.type,
                blob: currentAudioData.blob,
                duration: currentAudioData.duration
            });
            
            // Start transcription process
            await processAudio(currentAudioData, audioId);
        } catch (error) {
            console.error('Error processing recording:', error);
            alert('Ett fel uppstod vid bearbetning av inspelningen: ' + error.message);
            ui.hideProcessing();
        }
    });
    
    // Handle recording
    ui.startRecordBtn.addEventListener('click', async () => {
        const success = await audioProcessor.startRecording((time) => {
            ui.updateRecordingTime(time);
        });
        
        if (!success) {
            alert('Kunde inte starta inspelning. Vänligen kontrollera mikrofontillgång.');
            ui.resetRecording();
        }
    });
    
    ui.stopRecordBtn.addEventListener('click', async () => {
        const audioData = await audioProcessor.stopRecording();
        if (audioData) {
            currentAudioData = audioData;
            ui.setAudioSource(audioData.url);
        }
    });
    
    ui.discardRecordingBtn.addEventListener('click', () => {
        audioProcessor.cleanup();
        currentAudioData = null;
    });
    
    // Download buttons
    ui.downloadTranscriptionTxtBtn.addEventListener('click', () => {
        const text = ui.transcriptionText.textContent;
        ui.downloadTextFile(text, 'transkription.txt');
    });
    
    ui.downloadTranscriptionDocxBtn.addEventListener('click', () => {
        const text = ui.transcriptionText.textContent;
        ui.downloadWordDocument(text, 'transkription.docx');
    });
    
    ui.downloadSummaryTxtBtn.addEventListener('click', () => {
        const text = ui.summaryText.textContent;
        ui.downloadTextFile(text, 'sammanfattning.txt');
    });
    
    /**
     * Process audio for transcription and summarization
     * @param {Object} audioData - Audio data
     * @param {string} audioId - Audio ID in storage
     */
    async function processAudio(audioData, audioId) {
        try {
            const settings = ui.getSettings();
            
            // Load model
            ui.showProcessing('Laddar transkriptionsmodell...');
            ui.updateProcessingInfo('Detta kan ta en stund första gången en modell används.');
            
            // Check if model is already loaded
            if (!transcriptionService.isModelLoaded(settings.model)) {
                const modelLoaded = await transcriptionService.loadModel(settings.model, (progress) => {
                    ui.updateProgress(progress);
                });
                
                if (!modelLoaded) {
                    throw new Error('Kunde inte ladda transkriptionsmodell.');
                }
            }
            
            // Transcribe audio
            ui.showProcessing('Transkriberar ljud...');
            ui.updateProcessingInfo('Bearbetar ljud. Detta kan ta några minuter beroende på längden.');
            
            const transcription = await transcriptionService.transcribe(
                audioData.blob,
                settings.language,
                (progress) => {
                    ui.updateProgress(progress);
                }
            );
            
            // Summarize text if API key is available
            let summary = null;
            if (summarizationService.hasValidApiKey()) {
                ui.showProcessing('Skapar sammanfattning...');
                ui.updateProgress(0.5);
                
                summary = await summarizationService.summarizeWithOpenAI(
                    transcription,
                    settings.summaryLength,
                    settings.language
                );
                
                ui.updateProgress(1.0);
            }
            
            // Save results
            await storage.saveTranscription({
                audioId,
                fileName: audioData.name,
                transcription,
                summary,
                model: settings.model,
                language: settings.language
            });
            
            // Show results
            ui.hideProcessing();
            ui.showResults(transcription, summary);
        } catch (error) {
            console.error('Error in processing audio:', error);
            alert('Ett fel uppstod: ' + error.message);
            ui.hideProcessing();
        }
    }
});
