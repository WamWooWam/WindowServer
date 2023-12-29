param(
    [string]$Configuration = "release",
    [string[]]$Project = $null,
    [switch]$NoBuild = $false
)

$Root = Get-Location

if (-not ($NoBuild)) {
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

    # if -Project is passed, we only want to build those projects
    if ($null -ne $Project) {
        $projects = $projects | Where-Object { $Project -contains $_ }
        $parallelProjects = $parallelProjects | Where-Object { $Project -contains $_ }
    }

    foreach ($project in $projects) {
        #if $project is an array, get the first element
        if ($project -is [array]) {
            $proj = $project[0]
        }      
        else {
            $proj = $project
        }  

        Write-Host "Building $project"
        Push-Location $proj
        yarn ntos-link . /p:configuration=$Configuration
        Pop-Location
    }

    $parallelProjects | Foreach-Object -ThrottleLimit 5 -Parallel {
        if ($PSItem -is [array]) {
            $proj = $PSItem[0]
        }      
        else {
            $proj = $PSItem
        }  
        
        Write-Host "Building $PSItem"
        Push-Location $proj
        yarn ntos-link . /p:configuration=$USING:Configuration
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
