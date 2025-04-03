# Create backup of current structure
Write-Host "Creating backup..."
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item -Path "." -Destination "../backup_$timestamp" -Recurse

# Function to safely move files
function Move-FilesSafely {
    param (
        [string]$Source,
        [string]$Destination
    )
    
    if (Test-Path $Source) {
        Write-Host "Moving from $Source to $Destination"
        
        # Create destination directory first
        if (-not (Test-Path $Destination)) {
            New-Item -ItemType Directory -Path $Destination -Force
        }
        
        # Get all files and directories
        $items = Get-ChildItem -Path $Source -Recurse
        
        foreach ($item in $items) {
            # Calculate relative path
            $relativePath = $item.FullName.Substring($Source.Length + 1)
            $targetPath = Join-Path $Destination $relativePath
            
            # Create parent directory if it doesn't exist
            $targetDir = Split-Path -Parent $targetPath
            if (-not (Test-Path $targetDir)) {
                New-Item -ItemType Directory -Path $targetDir -Force
            }
            
            if ($item.PSIsContainer) {
                # If it's a directory, create it
                if (-not (Test-Path $targetPath)) {
                    New-Item -ItemType Directory -Path $targetPath -Force
                }
            } else {
                # If it's a file, move it
                if (Test-Path $targetPath) {
                    Write-Host "File already exists: $targetPath"
                    # Create a backup of the existing file
                    $backupPath = "$targetPath.backup"
                    Copy-Item -Path $targetPath -Destination $backupPath -Force
                }
                Move-Item -Path $item.FullName -Destination $targetPath -Force
            }
        }
    }
}

# Move API routes
Write-Host "Moving API routes..."
Move-FilesSafely -Source "api" -Destination "app/api"

# Move dashboard content
Write-Host "Moving dashboard content..."
Move-FilesSafely -Source "(dashboard)" -Destination "app/(dashboard)"

# Consolidate templates
Write-Host "Consolidating templates..."
Move-FilesSafely -Source "app/templates" -Destination "components/templates"

# Remove duplicate middleware
Write-Host "Removing duplicate middleware..."
if (Test-Path "middleware.ts") {
    Remove-Item "middleware.ts" -Force
}

# Reorganize components
Write-Host "Reorganizing components..."
# Create new component structure
$componentDirs = @(
    "components/ui",
    "components/features",
    "components/layouts",
    "components/shared"
)

foreach ($dir in $componentDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
    }
}

# Move feature-specific components
$featureMoves = @(
    @{Source = "components/auth"; Destination = "components/features/auth"},
    @{Source = "components/dashboard"; Destination = "components/features/dashboard"},
    @{Source = "components/subscription"; Destination = "components/features/subscription"},
    @{Source = "components/openai"; Destination = "components/features/openai"}
)

foreach ($move in $featureMoves) {
    Move-FilesSafely -Source $move.Source -Destination $move.Destination
}

# Clean up empty directories
Write-Host "Cleaning up empty directories..."
Get-ChildItem -Path "." -Directory -Recurse | Where-Object { 
    (Get-ChildItem $_.FullName -Recurse | Measure-Object).Count -eq 0 
} | Remove-Item -Recurse

Write-Host "Reorganization complete! Check the backup directory if you need to restore anything."
Write-Host "Note: Some files may have been backed up with .backup extension if they already existed in the destination." 