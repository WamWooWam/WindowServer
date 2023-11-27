import { LOAD_SUBSYSTEM, PROCESS_CRASH, PROCESS_EXIT } from "../types/ntdll.int.types.js";
import { PEB, SUBSYSTEM_DEF, SubsystemId } from "../types/types.js";
import {
    SUBSYS_GDI32,
    SUBSYS_KERNEL32,
    SUBSYS_NTDLL,
    SUBSYS_SHELL32,
    SUBSYS_USER32
} from "../types/subsystems.js";

import { KeBugCheckEx } from "../bugcheck.js";
import NTDLL from "../types/ntdll.types.js";
import { ObGetObject } from "../objects.js";
import { PsProcess } from "../process.js";

const ValidSubsystems = [SUBSYS_NTDLL, SUBSYS_KERNEL32, SUBSYS_USER32, SUBSYS_GDI32, SUBSYS_SHELL32];

async function SubsystemLoaded(peb: PEB, data: LOAD_SUBSYSTEM) {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    const subsys = data.lpSubsystem as SubsystemId;
    if (subsys == SUBSYS_NTDLL) return; // NTDLL is already loaded

    console.debug(`Loading subsystem ${subsys}...`);

    if (!ValidSubsystems.includes(subsys)) throw new Error(`Invalid subsystem ${subsys}`);

    // TODO: validate subsystem 
    const subsysExports = await import(`./${subsys}.js`);
    const subsystem = subsysExports.default as SUBSYSTEM_DEF;

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
    await process.Quit();
}

function ProcessCrash(peb: PEB, data: PROCESS_CRASH) {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    process.Terminate(data.uExitCode, data.error);
}

const NTDLL_SUBSYSTEM: SUBSYSTEM_DEF = {
    lpszName: SUBSYS_NTDLL,
    lpExports: {
        [NTDLL.LoadSubsystem]: SubsystemLoaded,
        [NTDLL.ProcessExit]: ProcessExit,
        [NTDLL.ProcessCrash]: ProcessCrash,
    }
};

export default NTDLL_SUBSYSTEM;