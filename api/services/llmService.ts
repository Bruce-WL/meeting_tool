import { TaskLogger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { 
  MEETING_ANALYSIS_SYSTEM_PROMPT, 
  MEETING_INTERMEDIATE_PROMPT,
  MEETING_PART1_SCHEMA,
  MEETING_PART2_SCHEMA,
  MEETING_PART3_SCHEMA
} from '../prompts/meetingPrompts.js';
import pLimit from 'p-limit';
import { promises as dns } from 'dns';
import os from 'os';

// Mify 中转：OpenAI 兼容接口
const MIFY_BASE_URL = process.env.MIFY_BASE_URL || 'http://model.mify.ai.srv/v1';
const MIFY_CHAT_URL = `${MIFY_BASE_URL.replace(/\/$/, '')}/chat/completions`;
const MAP_MODEL_NAME = process.env.MIFY_MAP_MODEL_NAME || 'gpt-5-codex-5';
const REDUCE_MODEL_NAME = process.env.MIFY_REDUCE_MODEL_NAME || 'gpt-5-codex-5';
const MAP_MODEL_PROVIDER_ID = process.env.MIFY_MAP_MODEL_PROVIDER_ID || process.env.MIFY_REDUCE_MODEL_PROVIDER_ID;
const REDUCE_MODEL_PROVIDER_ID = process.env.MIFY_REDUCE_MODEL_PROVIDER_ID || process.env.MIFY_MAP_MODEL_PROVIDER_ID;
const CHUNK_SIZE = 3000; // Characters per chunk for splitting
const LLM_RETRY_LIMIT = 5;
const LLM_RETRY_BASE_DELAY_MS = 5000;
const LLM_REQUEST_TIMEOUT_MS = 120000; // 2 minutes timeout

interface LlmConfig {
  apiKey: string;
}

type LlmMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type JsonSchema = Record<string, unknown>;

type LlmResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type RetryAttempt = {
  attempt: number;
  timestamp: string;
  httpStatus?: number;
  responseBody?: string;
  errorStack?: string;
  errorMessage?: string;
  durationMs: number;
  dnsLookupMs?: number;
  networkLatencyMs?: number;
};

export class LlmService {
  private apiKey: string;

  constructor(config: LlmConfig) {
    this.apiKey = config.apiKey;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // Deeply normalize object keys based on synonym map
  private deepNormalize(obj: any, synonyms: Record<string, string[]>): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepNormalize(item, synonyms));
    }
    if (obj !== null && typeof obj === 'object') {
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Check if key needs remapping
        let targetKey = key;
        for (const [canonical, aliases] of Object.entries(synonyms)) {
            if (aliases.includes(key)) {
                targetKey = canonical;
                break;
            }
        }
        newObj[targetKey] = this.deepNormalize(value, synonyms);
      }
      return newObj;
    }
    return obj;
  }

  private async callLlmWithRetry(messages: LlmMessage[], jsonSchema?: JsonSchema, useJsonMode: boolean = false, options?: { model?: string; providerId?: string }, logger?: TaskLogger): Promise<string> {
    let attempt = 0;
    const retryHistory: RetryAttempt[] = [];
    const host = new URL(MIFY_CHAT_URL).hostname;
    const skipDnsLookup = process.env.MIFY_SKIP_DNS_LOOKUP === 'true';

    while (attempt < LLM_RETRY_LIMIT) {
      const startTime = Date.now();
      let dnsLookupMs: number | undefined;
      try {
        if (logger && attempt > 0) {
          logger.log('LLM', `Retry attempt ${attempt + 1}/${LLM_RETRY_LIMIT}`, { model: options?.model });
        }
        if (!skipDnsLookup) {
          const dnsStart = Date.now();
          try {
            await dns.lookup(host);
            dnsLookupMs = Date.now() - dnsStart;
          } catch {
            dnsLookupMs = undefined;
          }
        }
        return await this.callLlm(messages, jsonSchema, useJsonMode, options, logger);
      } catch (error: any) {
        const durationMs = Date.now() - startTime;
        const retryInfo: RetryAttempt = {
            attempt: attempt + 1,
            timestamp: new Date().toISOString(),
            durationMs,
            errorStack: error instanceof Error ? error.stack : String(error),
            errorMessage: error instanceof Error ? error.message : String(error),
            dnsLookupMs,
            networkLatencyMs: dnsLookupMs !== undefined ? Math.max(durationMs - dnsLookupMs, 0) : undefined
        };
        
        // Extract HTTP status if available in error message or object
        if (error.status) retryInfo.httpStatus = error.status;
        
        // Try to attach response body if available (custom error property)
        if (error.responseBody) retryInfo.responseBody = error.responseBody;

        retryHistory.push(retryInfo);

        if (logger) {
            logger.error('LLM', `Attempt ${attempt + 1} failed`, retryInfo);
        }

        attempt++;
        if (attempt >= LLM_RETRY_LIMIT) {
            // Generate Failure Report
            const failureReport = {
                message: "LLM Request Failed after 5 attempts",
                history: retryHistory,
                systemInfo: {
                    cpuUsage: process.cpuUsage(),
                    memoryUsage: process.memoryUsage(),
                    activeHandles: typeof (process as any)._getActiveHandles === 'function' ? (process as any)._getActiveHandles().length : undefined,
                    loadAverage: os.loadavg(),
                    uptime: process.uptime()
                },
                dnsLookupMs: dnsLookupMs ?? null,
                networkLatencyMs: retryHistory.map(r => r.networkLatencyMs).filter(v => typeof v === 'number'),
                attempts: retryHistory.map(r => ({
                    attempt: r.attempt,
                    durationMs: r.durationMs,
                    httpStatus: r.httpStatus,
                    errorMessage: r.errorMessage
                }))
            };
            if (logger) {
                logger.error('LLM', 'FINAL FAILURE REPORT', failureReport);
            }
            throw new Error(`LLM Call Failed. Report: ${JSON.stringify(failureReport, null, 2)}`);
        }

        const delay = LLM_RETRY_BASE_DELAY_MS; // Fixed 5s delay as requested
        if (logger) {
          logger.log('LLM', `Waiting ${delay}ms before next retry...`);
        }
        await this.sleep(delay);
      }
    }
    throw new Error('Unreachable code');
  }

  // Helper to split text into chunks while preserving timestamp context
  private splitText(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let currentStart = 0;

    while (currentStart < text.length) {
      let currentEnd = Math.min(currentStart + maxLength, text.length);
      
      // Try to break at logical points to avoid cutting sentences or timestamps
      if (currentEnd < text.length) {
        // Priority: \n\n > \n > . > space
        // Avoid splitting inside [mm:ss]
        const lastDoubleNewline = text.lastIndexOf('\n\n', currentEnd);
        const lastNewline = text.lastIndexOf('\n', currentEnd);
        const lastTimestamp = text.lastIndexOf('[', currentEnd); // Try not to split right before a timestamp
        
        const minChunkSize = maxLength * 0.5;

        if (lastDoubleNewline > currentStart + minChunkSize) {
           currentEnd = lastDoubleNewline + 2;
        } else if (lastNewline > currentStart + minChunkSize) {
           currentEnd = lastNewline + 1;
        } else if (lastTimestamp > currentStart + minChunkSize && lastTimestamp < currentEnd) {
           // Break before the timestamp
           currentEnd = lastTimestamp;
        }
      }

      chunks.push(text.slice(currentStart, currentEnd));
      currentStart = currentEnd;
    }

    return chunks;
  }

  private async callLlm(messages: LlmMessage[], jsonSchema?: JsonSchema, useJsonMode: boolean = false, options?: { model?: string; providerId?: string }, logger?: TaskLogger): Promise<string> {
    const startTime = Date.now();
    const model = options?.model || REDUCE_MODEL_NAME;
    const payload: {
      model: string;
      messages: LlmMessage[];
      response_format?: { type: 'json_schema'; json_schema: JsonSchema } | { type: 'json_object' };
    } = {
      model,
      messages,
    };

    if (jsonSchema) {
      payload.response_format = {
        type: 'json_schema',
        json_schema: jsonSchema
      };
    } else if (useJsonMode) {
      payload.response_format = {
        type: 'json_object'
      };
    }

    if (logger) {
      logger.log('LLM', 'Calling API', {
        provider: 'mify',
        model: payload.model,
        messageCount: messages.length,
        firstMessagePreview: messages[0]?.content?.slice(0, 100),
        lastMessagePreview: messages[messages.length - 1]?.content?.slice(0, 200)
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLM_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(MIFY_CHAT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...(options?.providerId ? { 'X-Model-Provider-Id': options.providerId } : {})
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = `LLM API request failed: ${response.status} ${response.statusText} - ${errorText}`;
        if (logger) logger.error('LLM', 'API Request Failed', { status: response.status, errorText });
        const err = new Error(errorMsg);
        (err as any).status = response.status;
        (err as any).responseBody = errorText?.slice(0, 2000);
        throw err;
      }

      const data = (await response.json()) as LlmResponse;
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        if (logger) logger.error('LLM', 'Invalid Response Format', data);
        throw new Error('Invalid response format from LLM API');
      }

      const content = data.choices[0].message.content;
      
      if (logger) {
        logger.log('LLM', 'API Response Received', {
          durationMs: Date.now() - startTime,
          contentLength: content.length,
          contentPreview: content.slice(0, 200) + '...'
        });
      }

      return content;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const errorMsg = `LLM API request timed out after ${LLM_REQUEST_TIMEOUT_MS}ms`;
        if (logger) logger.error('LLM', 'API Request Timeout', { timeoutMs: LLM_REQUEST_TIMEOUT_MS });
        const err = new Error(errorMsg);
        (err as any).status = 408;
        (err as any).responseBody = 'timeout';
        throw err;
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async analyzeMeetingTranscript(
    transcript: string,
    onProgress?: (update: { stage?: string; progress?: number; details?: Record<string, unknown> }) => void,
    logger?: TaskLogger
  ): Promise<Record<string, unknown>> {
    if (!transcript) {
      throw new Error('Transcript is empty');
    }

    if (logger) {
      logger.log('LLM_FLOW', 'Start Analysis', { transcriptLength: transcript.length });
    }

    const reportProgress = (update: { stage?: string; progress?: number; details?: Record<string, unknown> }) => {
      if (onProgress) {
        onProgress(update);
      }
    };

    // Split transcript
    const chunks = this.splitText(transcript, CHUNK_SIZE);
    console.log(`Split transcript into ${chunks.length} chunks.`);
    if (logger) {
      logger.log('LLM_FLOW', 'Transcript Split', { chunkCount: chunks.length, chunkSize: CHUNK_SIZE });
    }

    // 1. MAP PHASE: Summarize each chunk in parallel
    reportProgress({ stage: 'LLM Analysis (Map Phase)', progress: 50, details: { chunks: chunks.length } });
    console.log("Processing chunks in parallel (Map Phase)...");
    
    const limit = pLimit(3); // Limit concurrency to 3
    
    const chunkPromises = chunks.map((chunk, index) => limit(async () => {
      try {
        const startChunk = Date.now();
        if (logger) logger.log('MAP', `Processing Chunk ${index + 1}/${chunks.length}`, { chunkLength: chunk.length });
        
        const result = await this.callLlmWithRetry([
          { role: 'system', content: MEETING_INTERMEDIATE_PROMPT },
          { role: 'user', content: `Meeting Segment ${index + 1}:\n\n${chunk}` }
        ] as LlmMessage[], undefined, false, { model: MAP_MODEL_NAME, providerId: MAP_MODEL_PROVIDER_ID }, logger);
        
        if (logger) logger.log('MAP', `Chunk ${index + 1} Completed`, { durationMs: Date.now() - startChunk });
        return `--- Segment ${index + 1} Analysis ---\n${result}\n`;
      } catch (err) {
        console.error(`Error processing chunk ${index}:`, err);
        if (logger) logger.error('MAP', `Chunk ${index + 1} Failed`, err);
        return `--- Segment ${index + 1} Analysis (Failed) ---\n`;
      }
    }));

    const results = await Promise.all(chunkPromises);
    const combinedNotes = results.join("\n");
    console.log("Intermediate analysis completed. Starting Reduce Phase...");
    if (logger) logger.log('LLM_FLOW', 'Map Phase Completed', { combinedNotesLength: combinedNotes.length });

    reportProgress({ stage: 'LLM Analysis (Reduce Phase)', progress: 60 });

    // 2. REDUCE PHASE: Synthesize final JSON from summaries (3 parts in parallel to cut wall time)
    // Use json_object mode instead of json_schema to avoid timeout on complex schemas
    console.log('Generating final report in 3 parts in parallel (Reduce Phase)...');
    
    let completedParts = 0;
    const reportPartProgress = (details?: Record<string, unknown>) => {
      completedParts += 1;
      const progress = 60 + Math.min(completedParts * 10, 30);
      reportProgress({ stage: 'LLM Analysis (Reduce Phase)', progress, details });
    };

    const generatePart = async (partName: string, fields: string[], schemaObj?: any, validator?: (data: any) => boolean) => {
        let attempt = 0;
        const maxRetries = 2; // Logic retries (separate from network retries)

        while (attempt <= maxRetries) {
            try {
                const startedAt = Date.now();
                if (logger) logger.log('REDUCE', `Starting ${partName} (Attempt ${attempt + 1})`, { fields });
                
                let prompt = `基于以上笔记，仅生成以下 JSON 字段: ${fields.join(', ')}。\n请返回一个合法的 JSON 对象。请确保内容使用中文。`;
                
                // Append schema definition to prompt to guide the model
                if (schemaObj && schemaObj.schema) {
                    prompt += `\n\n请严格遵循以下 JSON Schema:\n${JSON.stringify(schemaObj.schema, null, 2)}`;
                }

                const msgs: LlmMessage[] = [
                    { role: 'system', content: MEETING_ANALYSIS_SYSTEM_PROMPT },
                    { role: 'user', content: `Notes:\n${combinedNotes}\n\n${prompt}` }
                ];

                if (attempt > 0) {
                    // Add hint for retry
                    msgs.push({ role: 'user', content: `Previous attempt failed validation. Please ensure all fields (${fields.join(', ')}) are present and correctly structured according to the schema.` });
                }

                const jsonStr = await this.callLlmWithRetry(msgs, undefined, true, { model: REDUCE_MODEL_NAME, providerId: REDUCE_MODEL_PROVIDER_ID }, logger);
                let parsed = JSON.parse(jsonStr);
                const durationMs = Date.now() - startedAt;

                // 1. Universal Fuzzy Normalization
                parsed = this.deepNormalize(parsed, {
                    'title': ['groupName', 'groupTitle', 'name', 'moduleName', 'topic'],
                    'points': ['content', 'summary', 'description', 'bullets', 'details'],
                    'summaryGroups': ['groups', 'sections'],
                    'modules': ['items', 'cards']
                });

                // 2. Specific Repair Logic (e.g. Ensure arrays)
                if (partName === "Part 1" && parsed.summaryGroups) {
                    parsed.summaryGroups.forEach((g: any) => {
                        // AUTO-REPAIR: If modules missing but points exist at group level
                        // Structure: { title: "X", points: [...] } -> { title: "X", modules: [{ title: "General", points: [...] }] }
                        if ((!g.modules || g.modules.length === 0) && g.points && Array.isArray(g.points)) {
                             g.modules = [{
                                 title: "General",
                                 points: g.points
                             }];
                             delete g.points;
                        }

                        if (g.modules && Array.isArray(g.modules)) {
                            g.modules.forEach((m: any) => {
                                // Ensure points is array
                                if (m.points && !Array.isArray(m.points)) {
                                    m.points = [m.points];
                                }
                            });
                        }
                    });
                }
                
                // Validation
                if (validator) {
                    if (!validator(parsed)) {
                         const msg = `${partName} validation failed on attempt ${attempt + 1}`;
                         console.warn(msg);
                         if (logger) logger.warn('REDUCE', msg, { parsed });
                         
                         // SOFT VALIDATION: If we have core data, maybe we can proceed?
                         // For Part 1, we really need the structure.
                         // But for Part 2/3, we can be more lenient?
                         // For now, let's rely on the improved normalization to pass validation.
                         
                         attempt++;
                         continue;
                    }
                }

                reportPartProgress({ partName, durationMs });
                if (logger) logger.log('REDUCE', `${partName} Completed`, { durationMs });
                
                return parsed;
            } catch (e) {
                console.error(`${partName} failed attempt ${attempt + 1}`, e);
                if (logger) logger.error('REDUCE', `${partName} Failed Attempt`, e);
                attempt++;
            }
        }

        console.error(`${partName} failed after ${maxRetries + 1} attempts`);
        reportPartProgress({ partName, error: true });
        // Throw error to ensure the task is marked as failed instead of silently returning empty data
        throw new Error(`${partName} failed to generate valid JSON after ${maxRetries + 1} attempts.`);
    };

    const [part1, part2, part3] = await Promise.all([
      generatePart("Part 1", ["title", "date", "duration", "participants", "summaryOverview", "summaryGroups"], MEETING_PART1_SCHEMA, (data) => {
          // Repair: Ensure IDs exist
          if (data.summaryGroups && Array.isArray(data.summaryGroups)) {
            data.summaryGroups.forEach((g: any) => {
              if (!g.id) g.id = uuidv4();
              if (g.modules && Array.isArray(g.modules)) {
                g.modules.forEach((m: any) => {
                  if (!m.id) m.id = uuidv4();
                });
              }
            });
          }

          // Validate Part 1: Ensure summaryGroups structure
          if (!data.summaryGroups || !Array.isArray(data.summaryGroups)) return false;
          // Deep check modules and points
          return data.summaryGroups.every((g: any) => 
            g.modules && Array.isArray(g.modules) && g.modules.every((m: any) => 
              m.points && Array.isArray(m.points)
            )
          );
      }),
      generatePart("Part 2", ["summaryDetails", "smartChapters"], MEETING_PART2_SCHEMA, (data) => {
          // Repair: Ensure IDs for smartChapters
          if (data.smartChapters && Array.isArray(data.smartChapters)) {
            data.smartChapters.forEach((c: any) => {
              if (!c.id) c.id = uuidv4();
            });
          }
          return Array.isArray(data.summaryDetails) && Array.isArray(data.smartChapters);
      }),
      generatePart("Part 3", ["todoList", "keyDecisions", "goldenMoments", "aiDisclaimer"], MEETING_PART3_SCHEMA, (data) => {
          // Repair: Ensure IDs for todoList
          if (data.todoList && Array.isArray(data.todoList)) {
            data.todoList.forEach((t: any) => {
              if (!t.id) t.id = uuidv4();
            });
          }
          return Array.isArray(data.todoList) && Array.isArray(data.keyDecisions) && Array.isArray(data.goldenMoments);
      })
    ]);

    console.log('Reduce Phase completed. Merging results...');
    if (logger) logger.log('LLM_FLOW', 'Reduce Phase Completed', { parts: 3 });

    reportProgress({ stage: 'LLM Analysis (Finalize)', progress: 90, details: { combinedNotesLength: combinedNotes.length } });

    return {
      ...part1,
      ...part2,
      ...part3
    };
  }
}
