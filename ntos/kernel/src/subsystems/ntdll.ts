import NTDLL, { LOAD_LIBRARY, LOAD_LIBRARY_REPLY, LOAD_SUBSYSTEM, PROCESS_CRASH, PROCESS_EXIT } from "@window-server/ntdll/dist/ntdll.int.js";
import { PEB, SUBSYSTEM_DEF, SubsystemId } from "@window-server/sdk/types/types.js";
import {
    SUBSYS_GDI32,
    SUBSYS_KERNEL32,
    SUBSYS_NTDLL,
    SUBSYS_USER32
} from "@window-server/sdk/types/subsystems.js";

import GDI32_SUBSYSTEM from "./gdi32.js";
import KERNEL32_SUBSYSTEM from "./kernel32.js";
import { KeBugCheckEx } from "../bugcheck.js";
import { LdrLoadLibrary } from "../loader.js";
import { ObGetObject } from "../objects.js";
import { PsProcess } from "../process.js";
import USER32_SUBSYSTEM from "./user32.js";

const NTDLL_SUBSYSTEM: SUBSYSTEM_DEF = {
    lpszName: SUBSYS_NTDLL,
    lpExports: {
        [NTDLL.LoadSubsystem]: NTDLL_SubsystemLoaded,
        [NTDLL.ProcessExit]: NTDLL_ProcessExit,
        [NTDLL.ProcessCrash]: NTDLL_ProcessCrash,
        [NTDLL.LoadLibrary]: NTDLL_LoadLibrary,
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

export * from "@window-server/ntdll/dist/ntdll.int.js";

async function NTDLL_SubsystemLoaded(peb: PEB, data: LOAD_SUBSYSTEM) {
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

async function NTDLL_ProcessExit(peb: PEB, data: PROCESS_EXIT): Promise<void> {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    if (!process) {
        KeBugCheckEx(0x69, "ProcessExit: process not found");
    }
    await process.Quit();
}

function NTDLL_ProcessCrash(peb: PEB, data: PROCESS_CRASH): void {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    if (!process) {
        KeBugCheckEx(0x69, "ProcessCrash: process not found");
    }
    process.Terminate(data.uExitCode, data.error);
}

async function NTDLL_LoadLibrary(peb: PEB, data: LOAD_LIBRARY): Promise<LOAD_LIBRARY_REPLY> {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    if (!process) {
        KeBugCheckEx(0x69, "NTDLL_LoadLibrary: process not found");
    }

    let ret = await LdrLoadLibrary(peb, data.lpLibFileName);

    return {
        retVal: ret.hModule,
        lpszLibFile: ret.lpszEntryPoint,
        lpExecInfo: ret.lpExecInfo
    }
}