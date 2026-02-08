# Meeting Tool API Documentation

## Task Result Data Structure

The `result` field in the Task object follows this JSON structure:

### Shared Properties

- **smartChapters** (Array<SmartChapter>): 智能章节
  - `id`: string
  - `timestamp`: string (e.g., "05:23")
  - `title`: string (Topic title)
  - `summary`: string (Brief summary of the segment)

- **keyDecisions** (Array<string>): 关键决策
  - List of explicit decisions made during the meeting.
  - Expected format: "Decision: ... Rationale: ..."

- **goldenMoments** (Array<string>): 金句时刻
  - List of memorable quotes or insights.
  - Expected format: "Quote... (Context/Timestamp)"

### Full Schema

```json
{
  "title": "Meeting Title",
  "date": "2023-10-27",
  "duration": "45 minutes",
  "participants": [
    { "name": "Alice", "role": "PM" }
  ],
  "summaryOverview": "...",
  "summaryGroups": [ ... ],
  "summaryDetails": [ ... ],
  "todoList": [ ... ],
  "smartChapters": [
    {
      "id": "uuid",
      "timestamp": "00:00",
      "title": "Introduction",
      "summary": "..."
    }
  ],
  "keyDecisions": [
    "Decision 1: Adopt React. Rationale: Better ecosystem."
  ],
  "goldenMoments": [
    "\"We need to move fast.\" - Bob (10:00)"
  ],
  "aiDisclaimer": "..."
}
```

## Prompt Engineering Requirements

To ensure these fields are generated:
1. **System Prompt**: Must explicitly require "Smart Chapters", "Key Decisions", and "Golden Moments".
2. **Intermediate Prompt**: Must extract "Timeline", "Decisions", and "Highlights" from each chunk.
