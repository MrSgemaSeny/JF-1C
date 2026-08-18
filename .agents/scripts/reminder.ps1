$today = Get-Date -Format "yyyy-MM-dd"
$journalPath = "C:\Users\murat\IdeaProjects\new_world\Brain's protocol - second brain\journal\$today\jf-1c.md"

$response = @{
    injectSteps = @(
        @{
            ephemeralMessage = "CRITICAL WORKFLOW RULES:`n1. JOURNAL & PUSH: You must always run git add, git commit, git push and update the journal ($journalPath) after completing any stage or task.`n2. SECOND BRAIN: If you learn important project info, make architectural decisions, or discover critical debt, YOU MUST document it in the Second Brain (the context/ folder or valeur.md) so it isn't lost."
        }
    )
}

$response | ConvertTo-Json -Compress | Write-Output
exit 0
