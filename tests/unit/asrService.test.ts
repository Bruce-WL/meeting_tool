import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsrService } from '../../api/services/asrService';

global.fetch = vi.fn();

describe('AsrService', () => {
  let service: AsrService;

  beforeEach(() => {
    service = new AsrService({ apiKey: 'test-key' });
    vi.clearAllMocks();
  });

  it('should transcribe audio successfully', async () => {
    (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'Hello world' }),
    });

    const result = await service.transcribeAudio(Buffer.from('dummy'));
    expect(result).toBe('Hello world');
    expect(fetch).toHaveBeenCalled();
  });

  it('should throw error on API failure', async () => {
    (fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Error details',
    });

    await expect(service.transcribeAudio(Buffer.from('dummy'))).rejects.toThrow('ASR API request failed');
  });
});
