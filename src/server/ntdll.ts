import NTDLL, { LOAD_SUBSYSTEM, PROCESS_EXIT } from "../types/ntdll.types.js";
import { PEB, Subsystem } from "../types/types.js";
import {
    SUBSYS_GDI32,
    SUBSYS_KERNEL32,
    SUBSYS_NTDLL,
    SUBSYS_SHELL32,
    SUBSYS_USER32
} from "../types/subsystems.js";

import { ObGetObject } from "../objects.js";
import { PsProcess } from "../process.js";

const ValidSubsystems = [SUBSYS_NTDLL, SUBSYS_KERNEL32, SUBSYS_USER32, SUBSYS_GDI32, SUBSYS_SHELL32];

async function SubsystemLoaded(peb: PEB, data: LOAD_SUBSYSTEM) {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    const subsys = data.lpSubsystem as Subsystem;
    if (subsys == SUBSYS_NTDLL) return; // NTDLL is already loaded

    console.debug(`Loading subsystem ${subsys}...`);

    if (!ValidSubsystems.includes(subsys)) throw new Error(`Invalid subsystem ${subsys}`);

    // TODO: validate subsystem
    const subsysExports = await import(`./${subsys}.js`);
    process.loadSubsystem(subsys, subsysExports.default);

    const sharedMemory = data.cbSharedMemory ? new SharedArrayBuffer(data.cbSharedMemory) : undefined;
    return {
        lpSharedMemory: sharedMemory,
    }
}

function ProcessExit(peb: PEB, data: PROCESS_EXIT) {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    process.terminate();
}

const NTDLL_EXPORTS = {
    [NTDLL.LoadSubsystem]: SubsystemLoaded,
    [NTDLL.ProcessExit]: ProcessExit,
};

export default NTDLL_EXPORTS;