import { describe, it, expect } from 'vitest';
import { MEETING_ANALYSIS_SYSTEM_PROMPT, MEETING_INTERMEDIATE_PROMPT } from '../../api/prompts/meetingPrompts';

describe('Meeting Prompts', () => {
  it('System Prompt should contain mandatory generation requirements', () => {
    expect(MEETING_ANALYSIS_SYSTEM_PROMPT).toContain('**Smart Chapters (智能章节)**: 必须包含');
    expect(MEETING_ANALYSIS_SYSTEM_PROMPT).toContain('**Key Decisions (关键决议)**: 必须包含');
    expect(MEETING_ANALYSIS_SYSTEM_PROMPT).toContain('**Golden Moments (高光时刻)**: 必须包含');
    
    // Check for specific instructions
    expect(MEETING_ANALYSIS_SYSTEM_PROMPT).toContain('按议题自动聚合');
    expect(MEETING_ANALYSIS_SYSTEM_PROMPT).toContain('决策依据');
    expect(MEETING_ANALYSIS_SYSTEM_PROMPT).toContain('时间戳');
  });

  it('Intermediate Prompt should extract required fields', () => {
    expect(MEETING_INTERMEDIATE_PROMPT).toContain('Decisions (决议)');
    expect(MEETING_INTERMEDIATE_PROMPT).toContain('决策依据');
    expect(MEETING_INTERMEDIATE_PROMPT).toContain('Highlights (高光时刻)');
    expect(MEETING_INTERMEDIATE_PROMPT).toContain('Timeline (时间线)');
  });
});
