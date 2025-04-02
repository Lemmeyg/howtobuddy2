# Remove temporary script files
Write-Host "Removing temporary script files..."
Remove-Item -Path "reorganize.ps1" -Force
Remove-Item -Path "cleanup.ps1" -Force
Remove-Item -Path "move-remaining.ps1" -Force
Remove-Item -Path "restructure.ps1" -Force

# Remove src directory if it exists
Write-Host "`nRemoving src directory..."
if (Test-Path "src") {
    Remove-Item -Path "src" -Recurse -Force
}

Write-Host "`nFinal cleanup complete!"
Write-Host "The project structure is now ready for development." 