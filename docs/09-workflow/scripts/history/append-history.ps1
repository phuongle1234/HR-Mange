param(
  [Parameter(Mandatory = $true)][string]$EventType,
  [Parameter(Mandatory = $true)][string]$SessionId,
  [AllowNull()][string]$TaskId = $null,
  [Parameter(Mandatory = $true)][string]$Scope,
  [string]$Actor = "ai-agent",
  [string]$Summary = "",
  [string]$HistoryRoot = "docs/09-workflow/history"
)

$ErrorActionPreference = "Stop"

$allowedEventTypes = @(
  "session_started", "session_completed",
  "task_started", "task_resumed", "task_paused", "task_completed", "task_failed",
  "user_instruction", "decision", "finding", "finding_updated", "blocker_found", "blocker_resolved",
  "source_inspected", "file_modified", "command_executed",
  "test_started", "test_result", "build_result", "validation_result",
  "artifact_created", "artifact_updated",
  "memory_candidate_created", "memory_promoted", "memory_superseded",
  "conflict_detected", "error", "checkpoint"
)

if ($allowedEventTypes -notcontains $EventType) {
  throw "Unsupported event_type '$EventType'."
}

function Redact-SecretLikeText {
  param([AllowNull()][string]$Value)
  if ($null -eq $Value) { return $null }
  $redacted = $Value -replace '(?i)(password|token|secret|api[_-]?key|authorization|private[_-]?key)\s*[:=]\s*[^,\s]+', '$1=[REDACTED]'
  $redacted = $redacted -replace 'sk-[A-Za-z0-9_-]+', '[REDACTED]'
  return $redacted
}

$date = (Get-Date).ToString("yyyy-MM-dd")
$timestamp = (Get-Date).ToUniversalTime().ToString("o")
$historyDir = Join-Path $PWD $HistoryRoot
$historyFile = Join-Path $historyDir "$date.jsonl"

New-Item -ItemType Directory -Path $historyDir -Force | Out-Null

$event = [ordered]@{
  timestamp = $timestamp
  event_type = $EventType
  session_id = $SessionId
  task_id = $TaskId
  actor = $Actor
  scope = $Scope
  payload = [ordered]@{
    summary = (Redact-SecretLikeText $Summary)
  }
}

$json = $event | ConvertTo-Json -Compress -Depth 20
Add-Content -LiteralPath $historyFile -Value $json -Encoding UTF8
Write-Output $historyFile
