param([switch]$Setup)
$ErrorActionPreference='Stop'
$taskChromeCandidates=@("$env:ProgramFiles\Google\Chrome\Application\chrome.exe","${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe","$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")
$taskChrome=$taskChromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if(-not $taskChrome){Write-Host 'Google Chrome is required for this launcher. Install Chrome, then retry.';Read-Host 'Press Enter to close';exit 1}
$taskProfile=Join-Path $PSScriptRoot 'kiosk-profile'
$taskUrlFile=Join-Path $PSScriptRoot 'booth-url.txt'
$taskWebsite=(Get-Content -LiteralPath $taskUrlFile -Raw).Trim()
if($taskWebsite -notmatch '^https://[a-zA-Z0-9.-]+(?::[0-9]+)?/?$'){Write-Host 'Put your HTTPS Render booth URL in kiosk/booth-url.txt first.';Read-Host 'Press Enter to close';exit 1}
$taskArguments=@("--user-data-dir=`"$taskProfile`"",'--no-first-run',$taskWebsite)
if(-not $Setup){$taskArguments=@("--user-data-dir=`"$taskProfile`"",'--no-first-run','--kiosk-printing','--start-fullscreen',$taskWebsite)}
# This visible window is the booth interface requested by the operator.
Start-Process -FilePath $taskChrome -ArgumentList $taskArguments
