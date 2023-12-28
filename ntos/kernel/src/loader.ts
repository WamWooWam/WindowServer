import * as asar from 'asar'

import { FILE_SHARE_READ, GENERIC_ALL, OPEN_EXISTING } from "./subsystems/kernel32.js";
import { HANDLE, PEB } from "ntos-sdk/types/types.js";
import { NtCreateFile, NtGetDirectoryName, NtGetFileName, NtGetFileSizeEx, NtGetFileSystemGlobal, NtPathJoin, NtReadFile } from "./fs/file.js";
import { ObCloseHandle, ObCreateObject, ObDuplicateHandle, ObEnumHandlesByType, ObGetObject, ObSetHandleOwner, ObSetObject } from "./objects.js";

import Executable from "ntos-sdk/types/Executable.js";
import { IMAGEINFO } from "./types/image.js";
import { KeBugCheckEx } from "./bugcheck.js";
import { NtGetKernelPeb } from "./boot.js";
import { PsProcess } from "./process.js";

const processes: PsProcess[] = [];
const processCreateHooks: ((proc: PsProcess) => void)[] = [];
const processTerminateHooks: ((proc: PsProcess) => void)[] = [];

export async function PsCreateProcess(
    lpApplicationName: string,
    lpCommandLine: string,
    bInheritHandles: boolean,
    lpEnvironment: { [key: string]: string },
    lpCurrentDirectory: string,
    lpStartupInfo: any): Promise<HANDLE> {

    const mark = performance.mark("PsCreateProcess");

    // get filename from path
    const procName = lpApplicationName.split('\\').pop()!.split('/').pop();

    // TODO: this should be loaded from the executable file
    // const exec: Executable = {
    //     file: lpApplicationName,
    //     type: "executable",
    //     subsystem: "console",
    //     arch: "js",
    //     entryPoint: "main",
    //     dependencies: ["ntdll.js", "kernel32.js", "gdi32.js", "user32.js"],

    //     name: procName!,
    //     version: [1, 0, 0, 0],
    //     rsrc: {}
    // }

    const module = await LdrLoadLibrary(NtGetKernelPeb(), lpApplicationName);
    if (module.hModule === 0) {
        return 0;
    }

    const exec = module.lpExecInfo;
    const proc = new PsProcess(exec, lpApplicationName, lpCommandLine, lpCurrentDirectory, lpEnvironment);
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

export function PsProcessMarkCritical(hProcess: HANDLE, bCritical: boolean): boolean {
    const proc = ObGetObject<PsProcess>(hProcess);
    if (!proc) return false;
    proc.isCritical = bCritical;
    return true;
}

export function PsListProcesses(): HANDLE[] {
    return [...ObEnumHandlesByType("PROC")];
}

export function PsQuitProcess(hProcess: HANDLE, uExitCode: number): boolean {
    const proc = ObGetObject<PsProcess>(hProcess);
    if (!proc) return false;

    proc.Quit();
    return true;
}

export function PsTerminateProcess(hProcess: HANDLE): boolean {
    const proc = ObGetObject<PsProcess>(hProcess);
    if (!proc) return false;
    proc.Terminate();
    return true;
}

export function PsGetProcessId(hProcess: HANDLE): number {
    const proc = ObGetObject<PsProcess>(hProcess);
    if (!proc) return -1;
    return proc.id;
}

export function PsRegisterProcessHooks(onCreate?: (proc: PsProcess) => void, onTerminate?: (proc: PsProcess) => void) {
    if (onCreate)
        processCreateHooks.push(onCreate);
    if (onTerminate)
        processTerminateHooks.push(onTerminate);
}

const loadedModules: Map<string, IMAGEINFO> = new Map();

// TODO: this will need refactoring if/when we want to support webassembly modules
// TODO: modules should be loaded globally based on the file path, not per-process
export async function LdrLoadLibrary(peb: PEB, lpLibFileName: string): Promise<IMAGEINFO> {
    const process = peb && ObGetObject<PsProcess>(peb.hProcess);
    // if (!process) {
    //     KeBugCheckEx(0x69, "LdrLoadDll: process not found");
    // }

    // DLL Search order:
    // 1. Redirection (N/A)
    // 2. API sets (N/A)
    // 3. SxS (N/A)
    // 4. Loaded modules
    // 5. Known DLLs
    // 6. Executable directory
    // 7. System directory (system32, syswow64)
    // 8. 16-bit system directory (system, N/A)
    // 9. Windows directory 
    // 10. Current directory
    // 11. %PATH%

    // normalize the library name
    lpLibFileName = NtGetFileName(lpLibFileName).toLowerCase();

    // check if the library is already loaded in the process
    let loadedModule = process && process.lpLoadedImages.get(lpLibFileName);
    if (loadedModule) {
        // TODO: we probably shouldn't *always* increment the refcount
        // return {
        //     retVal: ObDuplicateHandle(loadedModule.hModule),
        //     lpszLibFile: loadedModule.lpszEntryPoint
        // }

        return { ...loadedModule, hModule: ObDuplicateHandle(loadedModule.hModule) };
    }

    // check if the library  is already loaded globally
    loadedModule = loadedModules.get(lpLibFileName);
    if (loadedModule) {
        process?.lpLoadedImages.set(lpLibFileName, loadedModule);
        return { ...loadedModule, hModule: ObDuplicateHandle(loadedModule.hModule) };
    }

    let loaderDirs = [
        process && NtGetDirectoryName(process.executable),
        "C:\\Windows\\System32",
        "C:\\Windows\\SysWASM",
        "C:\\Windows",
        process && process.cwd,
        ...((process && process.env.PATH?.split(":")) ?? [])
    ]

    let loaderPaths = [
        lpLibFileName,
        ...loaderDirs.filter(dir => dir).map(dir => NtPathJoin(dir!, lpLibFileName)),
    ]

    console.log(`LdrLoadLibrary: ${lpLibFileName} -> %O`, loaderPaths);

    for (const lpPath of loaderPaths) {
        const hFile = await NtCreateFile(peb, lpPath!, GENERIC_ALL, FILE_SHARE_READ, 0, OPEN_EXISTING, 0, 0);
        if (hFile === -1) continue;

        let ret1 = await NtGetFileSizeEx(peb, hFile);
        if (!ret1.retVal || ret1.lpFileSize === 0) {
            ObCloseHandle(hFile);
            continue;
        }

        let ret2 = await NtReadFile(peb, hFile, new Uint8Array(ret1.lpFileSize), ret1.lpFileSize);
        if (!ret2.retVal) {
            ObCloseHandle(hFile);
            continue;
        }

        console.log(ret2);

        const headerData = await asar.extractFile(ret2.lpBuffer!, '.header');
        const header: Executable = JSON.parse(new TextDecoder().decode(headerData));

        console.log(header);

        const entryPoint = await asar.extractFile(ret2.lpBuffer!, `.text/${header.file}`);
        const uri = URL.createObjectURL(new Blob([entryPoint], { type: 'text/javascript' }));

        loadedModule = ObCreateObject<IMAGEINFO>("MODULE", (hObj) => ({
            hModule: hObj,
            lpExecInfo: header,
            lpszEntryPoint: uri,
            lpData: ret2.lpBuffer!
        }), -1, (info) => URL.revokeObjectURL(info.lpszEntryPoint));

        process?.lpLoadedImages.set(lpLibFileName, { ...loadedModule });
        loadedModules.set(lpLibFileName, loadedModule);
        break;
    }

    if (!loadedModule) {
        return { hModule: 0 } as IMAGEINFO;
    }

    return { ...loadedModule, hModule: ObDuplicateHandle(loadedModule.hModule) };
}