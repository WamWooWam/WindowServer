#!/usr/bin/env pwsh

param(
    [switch]$NoBuild = $false,
    [switch]$NoConfigure = $false,
    [switch]$Clean = $false,
    [switch]$UseNpx = $false,
    [string]$Configuration = "debug",
    [string[]]$Project = $null
)

$projects = @(
    "dlls/ntdll",
    "dlls/kernel32",
    "dlls/gdi32",
    "dlls/user32"
)

$parallelProjects = @(
    "ntos/kernel",
    "ntos/ldr",
    "ntos/setup",
    "apps/notepad",
    "apps/wininit",
    "apps/tests"
)

function Push-Location-If-Array {
    param(
        $project
    )
    if ($project -is [array]) {
        Push-Location $project[0]
    }
    else {
        Push-Location $project
    }
}

Write-Host "Building WindowServer"
Write-Host "Configuration: $Configuration"

pnpm install

Write-Host "Preparing build environment"

Push-Location "sdk"
pnpm tsc
Pop-Location

Write-Host "Building external dependencies"

Push-Location "extern/asar"
pnpm tsc
Pop-Location

if (-not ($NoBuild)) {
    # if -Project is passed, we only want to build those projects
    if ($null -ne $Project) {
        $projects = $projects | Where-Object { $Project -contains $_ }
        $parallelProjects = $parallelProjects | Where-Object { $Project -contains $_ }
    }
    
    # build the projects
    foreach ($project in $projects) {
        Write-Host "Building $project"
        
        Push-Location-If-Array $project

        pnpm window-server-link . /p:configuration=$Configuration
        Pop-Location
    }

    $parallelProjects | Foreach-Object {        
        Write-Host "Building $PSItem"
        
        # can't use Push-Location-If-Array here because it's in a parallel block
        if ($PSItem -is [array]) {
            Push-Location $PSItem[0]
        }
        else {
            Push-Location $PSItem
        }

        pnpm window-server-link . /p:configuration=$Configuration
        Pop-Location
    }
}

Write-Host "Creating OS image"
New-Item .\dist -ItemType Directory -ErrorAction SilentlyContinue | Out-Null
New-Item .\dist\windows -ItemType Directory -Force | Out-Null
New-Item .\dist\windows\system32 -ItemType Directory -Force | Out-Null
New-Item .\dist\windows\system32\tests -ItemType Directory -Force | Out-Null

Copy-Item ntos/kernel/dist/ntoskrnl.exe dist/windows/system32/ntoskrnl.exe

Copy-Item dlls/ntdll/dist/ntdll.dll dist/windows/system32/
Copy-Item dlls/kernel32/dist/kernel32.dll dist/windows/system32/
Copy-Item dlls/user32/dist/user32.dll dist/windows/system32/
Copy-Item dlls/gdi32/dist/gdi32.dll dist/windows/system32/

Copy-Item apps/notepad/dist/notepad.exe dist/windows/
Copy-Item apps/wininit/dist/wininit.exe dist/windows/system32/

Copy-Item apps/tests/dist/*.exe dist/windows/system32/tests/

Copy-Item ntos/setup/dist/ntsetup.js dist/setup.js
Copy-Item ntos/ldr/dist/ntldr.js dist/

Write-Host "Creating install.zip"
Compress-Archive -Path dist/windows -DestinationPath dist/install.zip -Force

Remove-Item dist/windows -Recurse -Force
