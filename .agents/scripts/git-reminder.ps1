$inputJson = [Console]::In.ReadToEnd() | ConvertFrom-Json

$injectSteps = @()

$jf1cStatus = git status --porcelain
$jf1cUnpushed = git cherry -v 2>$null

Push-Location "C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain"
$brainStatus = git status --porcelain
$brainUnpushed = git cherry -v 2>$null
Pop-Location

if ($jf1cStatus -or $jf1cUnpushed -or $brainStatus -or $brainUnpushed) {
    $reason = "[WARNING] Не забывай про Workflow: ТЕСТЫ → ЖУРНАЛ → GIT PUSH. У тебя есть незакоммиченные или неотправленные изменения. Ты можешь остановиться, чтобы задать вопрос пользователю, но НЕ ЗАБУДЬ сделать push перед финальным завершением задачи!"
    $injectSteps += @{ ephemeralMessage = $reason }
}

@{ injectSteps = $injectSteps } | ConvertTo-Json -Depth 10 -Compress | Write-Output
