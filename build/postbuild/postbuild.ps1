
$configuration = "debug"
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
    "apps/wininit"
)

foreach ($project in $projects) {
    Write-Host "Building $project"
    Set-Location $project
    yarn ntos-link . /p:configuration=$configuration
    Set-Location ../..
}

$parallelProjects | Foreach-Object -ThrottleLimit 5 -Parallel {
    #Action that will run in Parallel. Reference the current object via $PSItem and bring in outside variables with $USING:varname
    Write-Host "Building $PSItem"
    Set-Location $PSItem
    yarn ntos-link . /p:configuration=$USING:configuration
    Set-Location ../..
}

Copy-Item ntos/kernel/dist/ntoskrnl.exe dist/windows/system32/ntoskrnl.exe

Copy-Item dlls/ntdll/dist/ntdll.dll dist/windows/system32/
Copy-Item dlls/kernel32/dist/kernel32.dll dist/windows/system32/
Copy-Item dlls/user32/dist/user32.dll dist/windows/system32/
Copy-Item dlls/gdi32/dist/gdi32.dll dist/windows/system32/

Copy-Item apps/notepad/dist/notepad.exe dist/windows/
Copy-Item apps/wininit/dist/wininit.exe dist/windows/system32/

Copy-Item ntos/setup/dist/ntsetup.js dist/setup.js
Copy-Item ntos/ldr/dist/ntldr.js dist/

Compress-Archive -Path dist/windows -DestinationPath dist/install.zip -Force


