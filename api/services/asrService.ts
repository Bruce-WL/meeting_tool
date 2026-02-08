import { TaskLogger } from '../utils/logger.js';

interface AsrConfig {
  apiKey: string;
}

const ASR_API_URL = 'http://model.mify.ai.srv/v1/audio/transcriptions';
const MODEL_PROVIDER_ID = 'volcengine_maas';
const MODEL_NAME = 'volc.bigasr.auc_turbo';

export class AsrService {
  private apiKey: string;

  constructor(config: AsrConfig) {
    this.apiKey = config.apiKey;
  }

  async transcribeAudio(audioBuffer: Buffer, logger?: TaskLogger): Promise<string> {
    const startTime = Date.now();
    if (logger) {
      logger.log('ASR', 'Starting transcription', { 
        bufferSize: audioBuffer.length,
        model: MODEL_NAME,
        provider: MODEL_PROVIDER_ID
      });
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('Audio buffer is empty');
    }

    const audioBase64 = audioBuffer.toString('base64');

    const payload = {
      audio: {
        data: audioBase64
      },
      model: MODEL_NAME
    };

    try {
      const response = await fetch(ASR_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Model-Provider-Id': MODEL_PROVIDER_ID,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ASR API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Try to parse utterances for timestamps
      let result = '';
      if (data.utterances && Array.isArray(data.utterances)) {
        // Volcengine style: [{text, start_time, end_time}, ...]
        result = data.utterances.map((u: any) => {
          const startMs = u.start_time || 0; // Assuming ms or seconds, need to verify. Volc usually returns ms.
          // Format [mm:ss]
          const minutes = Math.floor(startMs / 60000);
          const seconds = Math.floor((startMs % 60000) / 1000);
          const timeTag = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
          return `${timeTag} ${u.text}`;
        }).join('\n');
      } else if (data && typeof data.text === 'string') {
        // Fallback: Estimate timestamps if raw text only (approx 300ms per char for Chinese)
        const charDurationMs = 300; 
        const charsPerSegment = 50; // Add timestamp every ~50 chars
        let currentTimeMs = 0;
        const text = data.text;
        
        result = '';
        for (let i = 0; i < text.length; i += charsPerSegment) {
            const chunk = text.slice(i, i + charsPerSegment);
            const minutes = Math.floor(currentTimeMs / 60000);
            const seconds = Math.floor((currentTimeMs % 60000) / 1000);
            const timeTag = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
            result += `${timeTag} ${chunk}\n`;
            currentTimeMs += (chunk.length * charDurationMs);
        }
      } else {
        result = JSON.stringify(data);
      }

      if (logger) {
        logger.log('ASR', 'Transcription completed', {
          durationMs: Date.now() - startTime,
          resultLength: result.length,
          resultPreview: result.slice(0, 200) + '...'
        });
      }

      return result;
    } catch (error) {
      if (logger) {
        logger.error('ASR', 'Transcription failed', error);
      } else {
        console.error('Error calling ASR service:', error);
      }
      throw error;
    }
  }
}
