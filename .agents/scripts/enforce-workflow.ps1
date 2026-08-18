$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json

if ($null -eq $payload -or $null -eq $payload.toolCall -or $null -eq $payload.toolCall.args) {
    $response = @{
        decision = "allow"
    }
    $response | ConvertTo-Json -Compress | Write-Output
    exit 0
}

$commandArgs = $payload.toolCall.args.CommandLine

if ($commandArgs -match "git push") {
    $today = Get-Date -Format "yyyy-MM-dd"
    $journalPath = "C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain\journal\$today"
    
    $hasEntries = Test-Path -Path "$journalPath\*.md"
    
    if (-not $hasEntries) {
        $response = @{
            decision = "deny"
            reason = "[BLOCK AGENTS.md RULE #1] Attempted to 'git push' without a journal entry! First create a markdown file in '$journalPath' describing changes, then push."
        }
        $response | ConvertTo-Json -Compress | Write-Output
        exit 0
    }
}

$response = @{
    decision = "allow"
}
$response | ConvertTo-Json -Compress | Write-Output
exit 0
