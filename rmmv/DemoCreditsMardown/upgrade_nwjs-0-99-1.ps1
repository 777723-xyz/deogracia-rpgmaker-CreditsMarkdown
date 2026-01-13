# Script de patch pour RPG Maker MV (Compatibilité NW.js 0.99.1+)

$filePath = "js/rpg_core.js"
$backupPath = "js/rpg_core.js.bak"

if (Test-Path $filePath) {
    # Création d'une sauvegarde
    Write-Output "Sauvegarde de rpg_core.js en rpg_core.js.bak..." -ForegroundColor Cyan
    Copy-Item $filePath $backupPath -Force

    # Lecture du contenu
    $content = Get-Content $filePath -Raw

    # 1. Correction du warning 'willReadFrequently'
    Write-Output "Application du patch: willReadFrequently..." -ForegroundColor Yellow
    $content = $content -replace "getContext\('2d'\)", "getContext('2d', {willReadFrequently: true})"

    # 2. Correction du warning 'CanvasTextAlign'
    Write-Output "Application du patch: CanvasTextAlign..." -ForegroundColor Yellow
    $content = $content -replace "context\.textAlign = align;", "context.textAlign = align || 'left';"

    # Sauvegarde des modifications
    $content | Set-Content $filePath -NoNewline
    
    Write-Output "Terminé ! Les fichiers cœurs sont maintenant optimisés pour NW.js 0.99.1." -ForegroundColor Green
} else {
    Write-Output "Erreur : Impossible de trouver js/rpg_core.js. Assurez-vous de lancer le script à la racine du projet." -ForegroundColor Red
}

Pause