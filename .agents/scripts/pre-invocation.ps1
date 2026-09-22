[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$rawInput = ""
if ([Console]::IsInputRedirected) {
    $rawInput = [Console]::In.ReadToEnd()
}
if ([string]::IsNullOrWhiteSpace($rawInput)) {
    @{ injectSteps = @() } | ConvertTo-Json -Compress | Write-Output
    exit 0
}

$inputJson = $rawInput | ConvertFrom-Json
if ($null -eq $inputJson -or $inputJson.invocationNum -ne 1) {
    @{ injectSteps = @() } | ConvertTo-Json -Compress | Write-Output
    exit 0
}

$injectSteps = @()

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

@{ injectSteps = $injectSteps } | ConvertTo-Json -Depth 10 -Compress | Write-Output
