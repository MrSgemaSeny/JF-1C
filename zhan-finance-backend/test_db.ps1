$body = @{
    email = "admin@zhan-finance.com"
    password = "pass"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:8080/api/auth/login -Method Post -Body $body -ContentType "application/json"
$token = $response.data.accessToken

$pipelines = Invoke-RestMethod -Uri http://localhost:8080/api/crm/pipelines -Method Get -Headers @{ Authorization = "Bearer $token" }
Write-Output "Pipelines:"
$pipelines | ConvertTo-Json -Depth 5

$tasks = Invoke-RestMethod -Uri http://localhost:8080/api/crm/tasks -Method Get -Headers @{ Authorization = "Bearer $token" }
Write-Output "Tasks:"
$tasks | ConvertTo-Json -Depth 5
