$ErrorActionPreference='Stop'
$Repo=Join-Path $env:USERPROFILE 'Documents\GitHub\HAULMatch'
$Pack=Split-Path -Parent $MyInvocation.MyCommand.Path
if(-not(Test-Path (Join-Path $Repo '.git'))){throw 'Local HAULMatch repository not found.'}
$Backup="$Repo-BACKUP-G7-$(Get-Date -Format yyyyMMdd_HHmmss)"
New-Item -ItemType Directory -Path $Backup -Force|Out-Null
Get-ChildItem $Repo -Force|Where-Object Name -ne '.git'|Copy-Item -Destination $Backup -Recurse -Force
Get-ChildItem $Repo -Force|Where-Object Name -ne '.git'|Remove-Item -Recurse -Force
Get-ChildItem $Pack -Force|Where-Object Name -ne 'Deploy_G7_Full_To_GitHub.ps1'|Copy-Item -Destination $Repo -Recurse -Force
git -C $Repo add --all
git -C $Repo commit -m Deploy-HaulMatch-G7-Mobile-Uploads-Cumulative
git -C $Repo push origin main
Write-Host 'G7 cumulative pack pushed. Next update Apps Script Code.gs, run upgradeG7Sheets, and redeploy.' -ForegroundColor Green
