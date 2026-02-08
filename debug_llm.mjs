import { readFile } from 'node:fs/promises';
import { LlmService } from './api/services/llmService.ts';
import { AsrService } from './api/services/asrService.ts';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

const { MIFY_API_KEY, AUDIO_PATH } = process.env;

if (!MIFY_API_KEY) {
  console.error('Error: MIFY_API_KEY is missing in .env');
  process.exit(1);
}

const asrService = new AsrService({ apiKey: MIFY_API_KEY });
const llmService = new LlmService({ apiKey: MIFY_API_KEY });

async function debug() {
    let transcript = "";
    
    // 1. Get Transcript (if audio path provided, otherwise use dummy long text)
    if (AUDIO_PATH) {
        console.log(`Reading audio from: ${AUDIO_PATH}`);
        try {
            const audioBuffer = await readFile(AUDIO_PATH);
            console.log('Starting ASR transcription...');
            transcript = await asrService.transcribeAudio(audioBuffer);
            console.log('ASR completed. Transcript length:', transcript.length);
        } catch (e) {
            console.error("ASR Failed:", e);
            return;
        }
    } else {
        console.log("No AUDIO_PATH in env, using dummy long text...");
        transcript = "Long dummy text... ".repeat(500);
    }

    // 2. Call LLM and measure time
    console.log('Starting LLM analysis with gpt-5-pro...');
    const startTime = Date.now();
    try {
        const result = await llmService.analyzeMeetingTranscript(transcript);
        const endTime = Date.now();
        console.log('LLM Analysis Success!');
        console.log(`Time taken: ${(endTime - startTime) / 1000} seconds`);
        // console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        const endTime = Date.now();
        console.error('LLM Analysis Failed!');
        console.error(`Time taken: ${(endTime - startTime) / 1000} seconds`);
        console.error('Error Details:', error.message);
        
        if (error.message.includes('504')) {
            console.log("\n--- Analysis ---");
            console.log("Cause: 504 Gateway Time-out");
            console.log("Explanation: The request took too long to complete, and the API gateway (OpenResty) closed the connection.");
            console.log("Reason: Generating a large JSON response from a long transcript is computationally expensive and slow for the model.");
        }
    }
}

debug();
