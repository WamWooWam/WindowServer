import { PsProcess } from "./process.js";
import { ObGetObject } from "./objects.js";
import Executable from "./types/Executable.js";
import { HANDLE } from "./types/types.js";

export function PsCreateProcess(
    lpApplicationName: string,
    lpCommandLine: string,
    bInheritHandles: boolean,
    lpEnvironment: { [key: string]: string },
    lpCurrentDirectory: string,
    lpStartupInfo: any): HANDLE {

    // TODO: this should be loaded from the executable file
    const exec: Executable = {
        file: lpApplicationName,
        type: "executable",
        subsystem: "console",
        arch: "js",
        entryPoint: "main",
        dependencies: ["ntdll.js", "kernel32.js"],

        name: "test",
        version: [1, 0, 0, 0],
        rsrc: {}
    }

    const proc = new PsProcess(exec, lpCommandLine, lpCurrentDirectory, lpEnvironment);
    proc.start();

    return proc.handle;
}

export function PsTerminateProcess(hProcess: HANDLE, uExitCode: number): boolean {
    const proc = ObGetObject<PsProcess>(hProcess);
    proc.terminate();
    return true;
}

export function PsGetProcessId(hProcess: HANDLE): number {
    const proc = ObGetObject<PsProcess>(hProcess);
    return proc.id;
}