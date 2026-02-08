import { describe, it, expect } from 'vitest';
import { LlmService } from '../../api/services/llmService';

// Mock private method access
const getDeepNormalize = (service: LlmService) => (service as any).deepNormalize.bind(service);

describe('LlmService Normalization', () => {
  const service = new LlmService({ apiKey: 'test' });
  const deepNormalize = getDeepNormalize(service);

  const synonyms = {
    'title': ['groupName', 'groupTitle', 'name', 'moduleName', 'topic'],
    'points': ['content', 'summary', 'description', 'bullets', 'details'],
    'summaryGroups': ['groups', 'sections'],
    'modules': ['items', 'cards']
  };

  it('should normalize fuzzy keys', () => {
    const raw = {
      groupName: "Group 1",
      sections: [
        {
          groupTitle: "G1",
          items: [
            { moduleName: "M1", bullets: ["p1"] }
          ]
        }
      ]
    };

    const normalized = deepNormalize(raw, synonyms);

    expect(normalized.title).toBe("Group 1");
    expect(normalized.summaryGroups).toBeDefined();
    expect(normalized.summaryGroups[0].title).toBe("G1");
    expect(normalized.summaryGroups[0].modules[0].title).toBe("M1");
    expect(normalized.summaryGroups[0].modules[0].points).toEqual(["p1"]);
  });

  it('should handle nested arrays and objects', () => {
    const raw = {
      nested: {
        topic: "Topic 1",
        details: "Details 1"
      }
    };
    const normalized = deepNormalize(raw, synonyms);
    expect(normalized.nested.title).toBe("Topic 1");
    expect(normalized.nested.points).toBe("Details 1");
  });
});
