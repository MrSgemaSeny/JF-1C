[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$rawInput = ""
if ([Console]::IsInputRedirected) {
    $rawInput = [Console]::In.ReadToEnd()
}
if ([string]::IsNullOrWhiteSpace($rawInput)) {
    @{ decision = "allow" } | ConvertTo-Json -Compress | Write-Output
    exit 0
}

$payload = $rawInput | ConvertFrom-Json
if ($null -eq $payload -or $null -eq $payload.toolCall -or $null -eq $payload.toolCall.args) {
    @{ decision = "allow" } | ConvertTo-Json -Compress | Write-Output
    exit 0
}

$commandArgs = $payload.toolCall.args.CommandLine
if ([string]::IsNullOrWhiteSpace($commandArgs)) {
    @{ decision = "allow" } | ConvertTo-Json -Compress | Write-Output
    exit 0
}

if ($commandArgs -match "(?i)\bgit\s+push\b") {
    $today = Get-Date -Format "yyyy-MM-dd"
    $yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
    $journalBase = "C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain\journal"
    
    # Определяем имя текущего репозитория/проекта (jf-1c)
    $currentProjectName = (Get-Item (Get-Location)).Name.ToLower()
    $todayFile = Join-Path (Join-Path $journalBase $today) "$currentProjectName.md"
    $yesterdayFile = Join-Path (Join-Path $journalBase $yesterday) "$currentProjectName.md"
    
    # Также проверяем прямое совпадение jf-1c.md
    $todayFileDirect = Join-Path (Join-Path $journalBase $today) "jf-1c.md"
    $yesterdayFileDirect = Join-Path (Join-Path $journalBase $yesterday) "jf-1c.md"
    
    $hasValidJournal = $false
    foreach ($f in @($todayFile, $yesterdayFile, $todayFileDirect, $yesterdayFileDirect)) {
        if (Test-Path $f) {
            $content = Get-Content $f -Raw -Encoding UTF8
            if (-not [string]::IsNullOrWhiteSpace($content) -and $content.Length -gt 30) {
                $hasValidJournal = $true
                break
            }
        }
    }
    
    if (-not $hasValidJournal) {
        # Резервная проверка: любая запись в журнале за последние 24 часа
        $recent = Get-ChildItem -Path $journalBase -Recurse -Filter "*.md" -ErrorAction SilentlyContinue |
            Where-Object { $_.LastWriteTime -ge (Get-Date).AddHours(-24) }
        if ($recent) {
            $hasValidJournal = $true
        }
    }
    
    if (-not $hasValidJournal) {
        $response = @{
            decision = "deny"
            reason = "[WORKFLOW BARRIER] Попытка выполнить 'git push' без записи в журнале! Правило системы: ТЕСТЫ ПРОШЛИ -> ЗАПИСЬ В ЖУРНАЛ (journal/$today/jf-1c.md) -> GIT PUSH. Создайте запись в журнале Second Brain перед пушем."
        }
        $response | ConvertTo-Json -Compress | Write-Output
        exit 0
    }
}

@{ decision = "allow" } | ConvertTo-Json -Compress | Write-Output
exit 0
