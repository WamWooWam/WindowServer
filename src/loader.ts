import Executable from "./types/Executable.js";
import { HANDLE } from "./types/types.js";
import { ObGetObject } from "./objects.js";
import { PsProcess } from "./process.js";

const processes: PsProcess[] = [];
const processCreateHooks: ((proc: PsProcess) => void)[] = [];
const processTerminateHooks: ((proc: PsProcess) => void)[] = [];

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
    proc.onTerminate = () => {
        processTerminateHooks.forEach(hook => hook(proc));

        const index = processes.indexOf(proc);
        if (index !== -1) {
            processes.splice(index, 1);
        }
    }

    processes.push(proc);
    proc.Start();

    processCreateHooks.forEach(hook => hook(proc));

    return proc.handle;
}

export function PsTerminateProcess(hProcess: HANDLE, uExitCode: number): boolean {
    const proc = ObGetObject<PsProcess>(hProcess);
    proc.Terminate();
    return true;
}

export function PsGetProcessId(hProcess: HANDLE): number {
    const proc = ObGetObject<PsProcess>(hProcess);
    return proc.id;
}

export function PsRegisterProcessHooks(onCreate?: (proc: PsProcess) => void, onTerminate?: (proc: PsProcess) => void) {
    if (onCreate)
        processCreateHooks.push(onCreate);
    if (onTerminate)
        processTerminateHooks.push(onTerminate);
}