param(
  [Parameter(Mandatory=$true)][string]$RepositoryUrl,
  [string]$Branch = "main",
  [string]$Tag = "v1.0.0"
)
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "Git is not installed or not in PATH." }
if (-not (Test-Path -LiteralPath ".git")) {
  git init
  git remote add origin $RepositoryUrl
} else {
  $existing = git remote get-url origin 2>$null
  if ($LASTEXITCODE -ne 0) { git remote add origin $RepositoryUrl }
  elseif ($existing -ne $RepositoryUrl) { git remote set-url origin $RepositoryUrl }
}
git checkout -B $Branch
git add .
git commit -m "HaulMatch 360 Production Release REV9" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "No new changes to commit." }
git push -u origin $Branch --force-with-lease
git tag -f $Tag
git push origin $Tag --force
Write-Host "HaulMatch 360 REV9 uploaded and tagged $Tag" -ForegroundColor Green
