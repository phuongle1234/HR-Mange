param(
  [string]$SessionId,
  [string]$TaskId,
  [string]$EventType,
  [string]$Scope,
  [string]$HistoryRoot = "docs/09-workflow/history"
)

$ErrorActionPreference = "Stop"

$files = Get-ChildItem -LiteralPath (Join-Path $PWD $HistoryRoot) -Filter "*.jsonl" -File -ErrorAction SilentlyContinue
foreach ($file in $files) {
  $lineNumber = 0
  foreach ($line in Get-Content -LiteralPath $file.FullName) {
    $lineNumber++
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $event = $line | ConvertFrom-Json
    if ($SessionId -and $event.session_id -ne $SessionId) { continue }
    if ($TaskId -and $event.task_id -ne $TaskId) { continue }
    if ($EventType -and $event.event_type -ne $EventType) { continue }
    if ($Scope -and $event.scope -ne $Scope) { continue }
    [pscustomobject]@{
      file = $file.FullName
      line = $lineNumber
      timestamp = $event.timestamp
      event_type = $event.event_type
      session_id = $event.session_id
      task_id = $event.task_id
      actor = $event.actor
      scope = $event.scope
      summary = $event.payload.summary
    }
  }
}
