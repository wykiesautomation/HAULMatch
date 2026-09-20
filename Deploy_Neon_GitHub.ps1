$ErrorActionPreference='Stop'
$Repo=Join-Path $env:USERPROFILE 'Documents\GitHub\HAULMatch'
$Zip=Join-Path $env:USERPROFILE 'Downloads\HaulMatch_360_NEON_AUTH_DATA_API_FULL.zip'
$Stamp=Get-Date -Format 'yyyyMMdd_HHmmss'
$Temp=Join-Path $env:TEMP "HaulMatch_Neon_$Stamp"
$Backup=Join-Path $env:USERPROFILE "Documents\GitHub\HAULMatch_BACKUP_NEON_$Stamp"
if(-not(Test-Path "$Repo\.git")){throw "Git repository not found: $Repo"}
if(-not(Test-Path $Zip)){throw "ZIP not found in Downloads: $Zip"}
$answer=Read-Host 'Type DEPLOY NEON to continue'
if($answer -cne 'DEPLOY NEON'){Write-Host 'Cancelled';exit}
New-Item -ItemType Directory -Path $Backup -Force|Out-Null
Get-ChildItem $Repo -Force|Where-Object Name -ne '.git'|Copy-Item -Destination $Backup -Recurse -Force
New-Item -ItemType Directory -Path $Temp -Force|Out-Null
Expand-Archive -LiteralPath $Zip -DestinationPath $Temp -Force
$Source=Join-Path $Temp 'HAULMatch-main'
@('index.html','assets\config.js','assets\neon.js','assets\platform.js','transport-leads\index.html','NEON_INTEGRATION_README.txt')|ForEach-Object{if(-not(Test-Path (Join-Path $Source $_))){throw "Missing build file: $_"}}
Get-ChildItem $Repo -Force|Where-Object Name -ne '.git'|Remove-Item -Recurse -Force
Get-ChildItem $Source -Force|Copy-Item -Destination $Repo -Recurse -Force
cmd.exe /d /s /c "git -C `"$Repo`" add --all"
if($LASTEXITCODE -ne 0){throw 'git add failed'}
cmd.exe /d /s /c "git -C `"$Repo`" commit -m Deploy-HaulMatch-Neon-Auth-Data-API"
if($LASTEXITCODE -ne 0){throw 'git commit failed'}
cmd.exe /d /s /c "git -C `"$Repo`" push origin main"
if($LASTEXITCODE -ne 0){throw 'git push failed'}
Remove-Item $Temp -Recurse -Force
Write-Host 'SUCCESS: Neon Auth and Data API frontend deployed.' -ForegroundColor Green
Write-Host "Backup: $Backup" -ForegroundColor Cyan
