# Create backup of current structure
Write-Host "Creating backup..."
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Path "app/(dashboard)" -Destination "../backup_dashboard_$timestamp" -Recurse

# Create new dashboard directory
Write-Host "Creating new dashboard directory..."
New-Item -ItemType Directory -Path "app/dashboard" -Force

# Move files from (dashboard) to dashboard
Write-Host "Moving files..."
Move-Item -Path "app/(dashboard)/*" -Destination "app/dashboard/" -Force

# Remove old (dashboard) directory
Write-Host "Cleaning up..."
Remove-Item -Path "app/(dashboard)" -Recurse -Force

Write-Host "Dashboard routes fixed! The following URLs should now work:"
Write-Host "http://localhost:3000/dashboard"
Write-Host "http://localhost:3000/dashboard/documents" 