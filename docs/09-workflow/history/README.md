---
id: WORKFLOW-HISTORY
type: workflow
module: global
status: draft
---

# JSONL History

History is the lightweight chronological audit trail for this repository. It records meaningful execution events in daily JSONL files:

```text
docs/09-workflow/history/YYYY-MM-DD.jsonl
```

It is separate from:
- `AGENTS.md`: rules the AI must obey.
- `docs/09-workflow/memory.yaml`: compact durable knowledge worth remembering.
- `docs/09-workflow/session-context.md`: current handoff summary.
- specs under `docs/00-project` through `docs/07-frontend`: what the system should do.

## Event Shape

Each physical line is one valid JSON object:

```json
{"timestamp":"2026-08-28T12:00:00Z","event_type":"task_started","session_id":"SES-20260828-01","task_id":"WORK-XYZ","actor":"ai-agent","scope":"workflow","payload":{"summary":"Started task."}}
```

Required fields:
- `timestamp`: ISO-8601 timestamp.
- `event_type`: controlled event type.
- `session_id`: stable session id.
- `task_id`: task/work id, or `null` for session-level events.
- `actor`: usually `ai-agent` or `user`.
- `scope`: short area such as `backend`, `frontend`, `workflow`, `docs`.
- `payload`: object with safe details.

## Supported Event Types

- `session_started`
- `session_completed`
- `task_started`
- `task_resumed`
- `task_paused`
- `task_completed`
- `task_failed`
- `user_instruction`
- `decision`
- `finding`
- `finding_updated`
- `blocker_found`
- `blocker_resolved`
- `source_inspected`
- `file_modified`
- `command_executed`
- `test_started`
- `test_result`
- `build_result`
- `validation_result`
- `artifact_created`
- `artifact_updated`
- `memory_candidate_created`
- `memory_promoted`
- `memory_superseded`
- `conflict_detected`
- `error`
- `checkpoint`

## Security

Do not write secrets, passwords, JWTs, refresh tokens, API keys, authorization headers, private keys, database credentials, or large raw outputs. Store environment variable names when useful and replace sensitive values with `[REDACTED]`.

## Usage

Append:

```powershell
.\docs\09-workflow\scripts\history\append-history.ps1 -EventType task_completed -SessionId SES-20260828-01 -TaskId WORK-XYZ -Scope workflow -Summary "Task completed."
```

Query:

```powershell
.\docs\09-workflow\scripts\history\query-history.ps1 -TaskId WORK-XYZ
.\docs\09-workflow\scripts\history\query-history.ps1 -SessionId SES-20260828-01
.\docs\09-workflow\scripts\history\query-history.ps1 -EventType build_result
```

Validate:

```powershell
.\docs\09-workflow\scripts\history\validate-history.ps1
```

History should be queried only when previous execution evidence is needed. Do not load all JSONL files by default.
