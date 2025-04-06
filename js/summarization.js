/**
 * Summarization module for text summarization using OpenAI API
 */
class SummarizationService {
    constructor() {
        this.openaiApiKey = null;
    }

    /**
     * Set API key
     * @param {string} apiKey - OpenAI API key
     */
    setApiKey(apiKey) {
        this.openaiApiKey = apiKey;
    }

    /**
     * Get API key
     * @returns {string|null} - API key or null if not set
     */
    getApiKey() {
        return this.openaiApiKey;
    }

    /**
     * Check if API key is valid
     * @returns {boolean} - Whether API key is valid
     */
    hasValidApiKey() {
        return this.openaiApiKey && this.openaiApiKey.startsWith('sk-') && this.openaiApiKey.length > 20;
    }

    /**
     * Summarize text using OpenAI API
     * @param {string} text - Text to summarize
     * @param {string} summaryLength - Length of summary
     * @param {string} language - Language code
     * @returns {Promise<string>} - Summarized text
     */
    async summarizeWithOpenAI(text, summaryLength, language) {
        if (!this.hasValidApiKey()) {
            throw new Error('No valid OpenAI API key provided');
        }

        // Skip summarization for very short texts
        if (text.split(/\s+/).length < 20) {
            return text;
        }

        // Map summary length to description
        const lengthMap = {
            '1': 'mycket kort (1-2 meningar)',
            '2': 'kort (2-3 meningar)',
            '3': 'medellång (3-5 meningar)',
            '4': 'lång (5-7 meningar)',
            '5': 'mycket lång (7-10 meningar)'
        };

        const lengthDescription = lengthMap[summaryLength] || lengthMap['3'];

        // Determine language name for prompt
        const languageNames = {
            'sv': 'svenska',
            'en': 'engelska',
            'auto': 'samma språk som i texten'
        };
        
        const languageName = languageNames[language] || languageNames['auto'];

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openaiApiKey}`
                },
                body: JSON.stringify({
                    model: CONFIG.summarization.defaultModel,
                    messages: [
                        {
                            role: 'system',
                            content: `Du är en assistent som skapar högkvalitativa sammanfattningar på ${languageName}.`
                        },
                        {
                            role: 'user',
                            content: `
Nedan finns en text som ska sammanfattas. 
Skapa en ${lengthDescription} sammanfattning av texten på ${languageName}.
Sammanfattningen ska fånga den viktigaste informationen och behålla textens ursprungliga ton.

Text att sammanfatta:
${text}
`
                        }
                    ],
                    temperature: CONFIG.summarization.temperature,
                    max_tokens: CONFIG.summarization.maxTokens
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Summarization error:', error);
            
            // If the API request fails, fall back to extractive summarization
            return this.extractiveSummarize(text, summaryLength);
        }
    }

    /**
     * Perform extractive summarization as a fallback
     * @param {string} text - Text to summarize
     * @param {string} summaryLength - Length of summary
     * @returns {string} - Summarized text
     */
    extractiveSummarize(text, summaryLength) {
        if (!text) {
            return '';
        }
        
        // Map summary length to number of sentences
        const lengthMap = {
            '1': 1,
            '2': 2,
            '3': 3,
            '4': 5,
            '5': 7
        };
        
        const numSentences = lengthMap[summaryLength] || 3;
        
        // Split text into sentences
        const sentences = this.splitIntoSentences(text);
        
        // For short texts, return the original
        if (sentences.length <= numSentences) {
            return text;
        }
        
        // Simple extractive approach: take first few sentences and last sentence
        const importantIndices = [...Array(Math.min(numSentences - 1, sentences.length - 1)).keys()];
        
        // Add the last sentence if we have room
        if (importantIndices.length < numSentences && sentences.length > importantIndices.length) {
            importantIndices.push(sentences.length - 1);
        }
        
        // Sort indices to maintain original order
        importantIndices.sort((a, b) => a - b);
        
        // Extract important sentences
        const summarySentences = importantIndices.map(i => sentences[i]);
        
        return summarySentences.join(' ');
    }

    /**
     * Split text into sentences
     * @param {string} text - Text to split
     * @returns {string[]} - Array of sentences
     */
    splitIntoSentences(text) {
        // Simple sentence splitting for multiple languages
        // This handles common ending punctuation in European languages
        return text
            .replace(/([.!?])\s+([A-ZÅÄÖÜÉÈÁÀÂÍÌÎÓÒÔÚÙÛ])/g, '$1\n$2')  // Add newlines after sentence endings followed by capital letters
            .split('\n')                                               // Split by newlines
            .map(s => s.trim())                                        // Trim whitespace
            .filter(s => s.length > 0);                               // Remove empty strings
    }
}