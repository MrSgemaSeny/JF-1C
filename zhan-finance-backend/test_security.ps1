function Get-StatusCode {
    param($Uri, $Method="Get")
    try {
        if ($Method -eq "Post") {
            $resp = Invoke-WebRequest -Uri $Uri -Method Post -ContentType "application/json" -Body '{}' -UseBasicParsing
        } else {
            $resp = Invoke-WebRequest -Uri $Uri -Method Get -UseBasicParsing
        }
        return $resp.StatusCode
    } catch {
        return $_.Exception.Response.StatusCode.value__
    }
}

Write-Host "--- TEST 1: /uploads/avatars/test.jpg (Expect 401) ---"
Write-Host "Status Code: $(Get-StatusCode 'http://localhost:8080/uploads/avatars/test.jpg')"

Write-Host "`n--- TEST 2: /swagger-ui.html (Expect 404 or 401) ---"
Write-Host "Status Code: $(Get-StatusCode 'http://localhost:8080/swagger-ui.html')"

Write-Host "`n--- TEST 3: Rate Limiting on /api/auth/login (Expect 429 after 10 requests) ---"
for ($i=1; $i -le 12; $i++) {
    Write-Host "Request ${i}: $(Get-StatusCode 'http://localhost:8080/api/auth/login' 'Post')"
}
