$envVars = Get-Content ".env" | ForEach-Object {
    $parts = $_ -split "="
    if ($parts.Length -eq 2) {
        Set-Item -Path "env:$($parts[0])" -Value "$($parts[1])"
    }
}
uvicorn app.main:app --reload