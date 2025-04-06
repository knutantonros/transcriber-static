/**
 * Configuration settings for the Audio Transcription & Summarization App
 */
const CONFIG = {
    // App info
    version: '1.0.0',
    
    // Storage keys
    storage: {
        apiKey: 'transcription_app_api_key',
        model: 'transcription_app_model',
        summaryLength: 'transcription_app_summary_length',
        language: 'transcription_app_language',
        recentFiles: 'transcription_app_recent_files'
    },
    
    // Model configurations
    models: {
        'whisper-tiny': {
            name: 'KB Whisper Tiny',
            size: '75 MB',
            speed: 'Mycket snabb',
            accuracy: 'Grundläggande'
        },
        'whisper-base': {
            name: 'KB Whisper Base',
            size: '142 MB',
            speed: 'Snabb',
            accuracy: 'Bra'
        },
        'whisper-small': {
            name: 'KB Whisper Small',
            size: '466 MB',
            speed: 'Medium',
            accuracy: 'Mycket bra'
        },
        'whisper-medium': {
            name: 'KB Whisper Medium',
            size: '1.5 GB',
            speed: 'Långsam',
            accuracy: 'Utmärkt'
        },
        'whisper-large': {
            name: 'KB Whisper Large',
            size: '3 GB',
            speed: 'Mycket långsam',
            accuracy: 'Överlägsen'
        }
    },
    
    // Summary length settings
    summaryLengths: {
        1: 'Mycket kort',
        2: 'Kort',
        3: 'Medium',
        4: 'Lång',
        5: 'Mycket lång'
    },
    
    // Supported languages
    languages: {
        'sv': 'Svenska',
        'en': 'Engelska',
        'auto': 'Automatisk igenkänning'
    },
    
    // API endpoints
    api: {
        openai: 'https://api.openai.com/v1/chat/completions'
    },
    
    // File settings
    files: {
        maxSizeMB: 25,
        supportedAudioFormats: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'webm'],
        supportedVideoFormats: ['mp4', 'mov', 'webm']
    },
    
    // Summarization settings
    summarization: {
        defaultModel: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.5
    }
};