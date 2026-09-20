$ErrorActionPreference='Stop'
$Repo=Join-Path $env:USERPROFILE 'Documents\GitHub\HAULMatch'
$Pack=Split-Path -Parent $MyInvocation.MyCommand.Path
if(-not(Test-Path(Join-Path $Repo '.git'))){throw "Repo not found: $Repo"}
$stamp=Get-Date -Format 'yyyyMMdd_HHmmss';$backup=Join-Path $env:USERPROFILE "Documents\GitHub\HAULMatch_BACKUP_HOME_FIX_$stamp"
New-Item -ItemType Directory -Path $backup -Force|Out-Null
Get-ChildItem $Repo -Force|Where-Object Name -ne '.git'|Copy-Item -Destination $backup -Recurse -Force
$old=$ErrorActionPreference;$ErrorActionPreference='Continue'
cmd.exe /d /s /c "git -C `"$Repo`" rebase --abort" 2>$null
cmd.exe /d /s /c "git -C `"$Repo`" fetch origin main"
if($LASTEXITCODE -ne 0){throw 'git fetch failed'}
cmd.exe /d /s /c "git -C `"$Repo`" switch -C main origin/main"
if($LASTEXITCODE -ne 0){throw 'git switch failed'}
Get-ChildItem $Repo -Force|Where-Object Name -ne '.git'|Remove-Item -Recurse -Force
Get-ChildItem $Pack -Force|Where-Object Name -ne 'Deploy_Home_Live_Lead_Fix.ps1'|Copy-Item -Destination $Repo -Recurse -Force
cmd.exe /d /s /c "git -C `"$Repo`" add --all"
if($LASTEXITCODE -ne 0){throw 'git add failed'}
cmd.exe /d /s /c "git -C `"$Repo`" commit -m `"Fix Home live lead source and public photos`""
if($LASTEXITCODE -ne 0){$s=cmd.exe /d /s /c "git -C `"$Repo`" status --porcelain";if($s){throw 'git commit failed'}}
cmd.exe /d /s /c "git -C `"$Repo`" push origin main"
if($LASTEXITCODE -ne 0){throw 'git push failed'}
$ErrorActionPreference=$old
Write-Host 'SUCCESS: Home and Transport Leads now use the current Apps Script published leads.' -ForegroundColor Green
Write-Host 'NEXT: Copy google-apps-script\Code.gs into Apps Script and deploy New version.' -ForegroundColor Yellow
Write-Host "Backup: $backup" -ForegroundColor Cyan
