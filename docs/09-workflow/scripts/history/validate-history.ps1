param(
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

$requiredFields = @("timestamp", "event_type", "session_id", "actor", "scope", "payload")
$root = Join-Path $PWD $HistoryRoot
$files = Get-ChildItem -LiteralPath $root -Filter "*.jsonl" -File -ErrorAction SilentlyContinue
$errors = New-Object System.Collections.Generic.List[string]

foreach ($file in $files) {
  $lineNumber = 0
  foreach ($line in Get-Content -LiteralPath $file.FullName) {
    $lineNumber++
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    try {
      $event = $line | ConvertFrom-Json
    } catch {
      $errors.Add("$($file.FullName):$lineNumber invalid JSON: $($_.Exception.Message)")
      continue
    }

    foreach ($field in $requiredFields) {
      if (-not ($event.PSObject.Properties.Name -contains $field)) {
        $errors.Add("$($file.FullName):$lineNumber missing required field '$field'")
      }
    }

    if ($event.event_type -and $allowedEventTypes -notcontains $event.event_type) {
      $errors.Add("$($file.FullName):$lineNumber unsupported event_type '$($event.event_type)'")
    }

    if ($event.timestamp) {
      $parsed = [datetime]::MinValue
      if (-not [datetime]::TryParse($event.timestamp, [ref]$parsed)) {
        $errors.Add("$($file.FullName):$lineNumber invalid timestamp '$($event.timestamp)'")
      }
    }

    if ($event.payload -and $event.payload.GetType().Name -notin @("PSCustomObject", "Hashtable", "OrderedDictionary")) {
      $errors.Add("$($file.FullName):$lineNumber payload must be an object")
    }

    $serialized = $event | ConvertTo-Json -Compress -Depth 20
    if ($serialized -match '(?i)(sk-[A-Za-z0-9_-]+|password["'']?\s*:\s*["''][^"'']+|authorization["'']?\s*:\s*["''][^"'']+|private[_-]?key["'']?\s*:\s*["''][^"'']+)') {
      $errors.Add("$($file.FullName):$lineNumber contains a likely secret")
    }
  }
}

if ($errors.Count -gt 0) {
  $errors | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Output "History validation passed for $($files.Count) JSONL file(s)."
