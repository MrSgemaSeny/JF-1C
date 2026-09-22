[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$rawInput = ""
if ([Console]::IsInputRedirected) {
    $rawInput = [Console]::In.ReadToEnd()
}
if ([string]::IsNullOrWhiteSpace($rawInput)) {
    @{ injectSteps = @() } | ConvertTo-Json -Compress | Write-Output
    exit 0
}

$inputJson = $rawInput | ConvertFrom-Json
if ($null -eq $inputJson) {
    @{ injectSteps = @() } | ConvertTo-Json -Compress | Write-Output
    exit 0
}

$injectSteps = @()

if ($inputJson.invocationNum -eq 1) {
    $contextMd = Join-Path $PSScriptRoot "..\CONTEXT.md"
    if (Test-Path $contextMd) {
        $content = Get-Content $contextMd -Raw -Encoding UTF8
        $injectSteps += @{ ephemeralMessage = "[AUTO-INJECTED] CONTENTS OF .agents/CONTEXT.md:`n$content" }
    }

    $brainDir = "C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain\context"
    if (Test-Path $brainDir) {
        foreach ($file in Get-ChildItem -Path $brainDir -Filter "*.md") {
            $content = Get-Content $file.FullName -Raw -Encoding UTF8
            $injectSteps += @{ ephemeralMessage = "[AUTO-INJECTED SECOND BRAIN] $($file.Name):`n$content" }
        }
    }
}

# MANDATORY WORKFLOW REMINDER ON EVERY STEP
$today = Get-Date -Format "yyyy-MM-dd"
$injectSteps += @{ ephemeralMessage = "[CRITICAL WORKFLOW PROTOCOL] MANDATORY RULE: TESTS PASSED -> WRITE TO JOURNAL (Brain's protocol - second brain\journal\$today\jf-1c.md) -> GIT COMMIT & PUSH (in JF-1C, tgbot, and Second Brain). You MUST commit, push, and record every milestone before stopping!" }

$jsonString = @{ injectSteps = $injectSteps } | ConvertTo-Json -Depth 10 -Compress
$jsonBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonString)
$stdout = [Console]::OpenStandardOutput()
$stdout.Write($jsonBytes, 0, $jsonBytes.Length)
$stdout.Flush()
