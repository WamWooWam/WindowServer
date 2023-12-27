import KERNEL32_SUBSYSTEM, { GENERIC_ALL, OPEN_EXISTING } from "./kernel32.js";
import NTDLL, { LOAD_LIBRARY, LOAD_LIBRARY_REPLY, LOAD_SUBSYSTEM, PROCESS_CRASH, PROCESS_EXIT } from "ntdll/dist/ntdll.int.js";
import { NtCreateFile, NtGetDirectoryName, NtGetFileName, NtGetFileSizeEx, NtReadFile } from "../fs/file.js";
import { ObCloseHandle, ObDuplicateHandle, ObGetObject, ObSetHandleOwner, ObSetObject } from "../objects.js";
import { PEB, SUBSYSTEM_DEF, SubsystemId } from "ntos-sdk/types/types.js";
import {
    SUBSYS_GDI32,
    SUBSYS_KERNEL32,
    SUBSYS_NTDLL,
    SUBSYS_USER32
} from "ntos-sdk/types/subsystems.js";

import { FILE_SHARE_READ } from "kernel32";
import GDI32_SUBSYSTEM from "./gdi32.js";
import { KeBugCheckEx } from "../bugcheck.js";
import { PsProcess } from "../process.js";
import USER32_SUBSYSTEM from "./user32.js";

const NTDLL_SUBSYSTEM: SUBSYSTEM_DEF = {
    lpszName: SUBSYS_NTDLL,
    lpExports: {
        [NTDLL.LoadSubsystem]: SubsystemLoaded,
        [NTDLL.ProcessExit]: ProcessExit,
        [NTDLL.ProcessCrash]: ProcessCrash,
        [NTDLL.LoadLibrary]: LdrLoadDll,
    }
};

export default NTDLL_SUBSYSTEM;
const ValidSubsystems = [SUBSYS_NTDLL, SUBSYS_KERNEL32, SUBSYS_USER32, SUBSYS_GDI32];
const SubsystemMap = new Map<SubsystemId, SUBSYSTEM_DEF>([
    [SUBSYS_NTDLL, NTDLL_SUBSYSTEM],
    [SUBSYS_KERNEL32, KERNEL32_SUBSYSTEM],
    [SUBSYS_USER32, USER32_SUBSYSTEM],
    [SUBSYS_GDI32, GDI32_SUBSYSTEM],
]);

export * from "ntdll/dist/ntdll.int.js";

async function SubsystemLoaded(peb: PEB, data: LOAD_SUBSYSTEM) {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    if (!process) {
        return KeBugCheckEx(0x69, "SubsystemLoaded: process not found");
    }

    const subsys = data.lpSubsystem as SubsystemId;
    if (subsys == SUBSYS_NTDLL) return; // NTDLL is already loaded

    console.debug(`Loading subsystem ${subsys}...`);

    if (!ValidSubsystems.includes(subsys)) throw new Error(`Invalid subsystem ${subsys}`);

    // TODO: validate subsystem 
    const subsysExports = SubsystemMap.get(subsys);
    const subsystem = subsysExports as SUBSYSTEM_DEF;

    let sharedMemory = null;
    if (data.cbSharedMemory) {
        sharedMemory = new SharedArrayBuffer(data.cbSharedMemory);
    }

    process.CreateSubsystem(subsystem, sharedMemory);

    return {
        lpSharedMemory: sharedMemory,
    }
}

async function ProcessExit(peb: PEB, data: PROCESS_EXIT) {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    if (!process) {
        KeBugCheckEx(0x69, "ProcessExit: process not found");
        return;
    }
    await process.Quit();
}

function ProcessCrash(peb: PEB, data: PROCESS_CRASH) {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    if (!process) {
        KeBugCheckEx(0x69, "ProcessCrash: process not found");
        return;
    }
    process.Terminate(data.uExitCode, data.error);
}

// TODO: this will need refactoring if/when we want to support webassembly modules
// TODO: modules should be loaded globally based on the file path, not per-process
export async function LdrLoadDll(peb: PEB, data: LOAD_LIBRARY): Promise<LOAD_LIBRARY_REPLY> {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    if (!process) {
        KeBugCheckEx(0x69, "LdrLoadDll: process not found");
    }

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
    const lpLibFileName = NtGetFileName(data.lpLibFileName).toLowerCase();

    // check if the library is already loaded
    let loadedModule = process.lpLoadedImages.get(lpLibFileName);
    if (loadedModule) {
        // TODO: we probably shouldn't *always* increment the refcount
        return {
            retVal: ObDuplicateHandle(loadedModule.hModule),
            lpszLibFile: loadedModule.lpszLibFile
        }
    }

    let loaderDirs = [
        NtGetDirectoryName(process.executable),
        "C:\\Windows\\System32",
        "C:\\Windows\\SysWASM",
        "C:\\Windows",
        process.cwd,
        ...(process.env.PATH?.split(":") ?? [])
    ]

    let loaderPaths = [
        data.lpLibFileName,
        ...loaderDirs.map(dir => `${dir}\\${lpLibFileName}`),
    ]

    for (const path of loaderPaths) {
        const hFile = await NtCreateFile(peb, path, GENERIC_ALL, FILE_SHARE_READ, 0, OPEN_EXISTING, 0, 0);
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

        const uri = URL.createObjectURL(new Blob([ret2.lpBuffer!], { type: "text/javascript" }));
        const hModule = ObSetObject<string>(uri, "MODULE", peb.hProcess, () => URL.revokeObjectURL(uri));
        ObSetHandleOwner(hFile, hModule); // close the file when the module is closed

        let module = {
            hModule,
            lpszLibFile: uri
        };

        process.lpLoadedImages.set(lpLibFileName, module);
        break;
    }

    loadedModule = process.lpLoadedImages.get(lpLibFileName);
    if (!loadedModule) {
        return {
            retVal: 0,
            lpszLibFile: ""
        }
    }

    return {
        retVal: loadedModule.hModule,
        lpszLibFile: loadedModule.lpszLibFile
    }
}