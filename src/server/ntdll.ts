import { ObGetObject } from "../objects.js";
import { PsProcess } from "../process.js";
import {
    SUBSYS_GDI32,
    SUBSYS_KERNEL32,
    SUBSYS_NTDLL,
    SUBSYS_SHELL32,
    SUBSYS_USER32
} from "../types/subsystems.js";
import { PEB, Subsystem } from "../types/types.js";
import NTDLL from "../types/ntdll.types.js";

const ValidSubsystems = [SUBSYS_NTDLL, SUBSYS_KERNEL32, SUBSYS_USER32, SUBSYS_GDI32, SUBSYS_SHELL32];

async function SubsystemLoaded(peb: PEB, data: any) {
    const process = ObGetObject<PsProcess>(peb.hProcess);
    const subsys = data.subsys as Subsystem;
    if (subsys == SUBSYS_NTDLL) return; // NTDLL is already loaded

    console.debug(`Loading subsystem ${subsys}...`);

    if (!ValidSubsystems.includes(subsys)) throw new Error(`Invalid subsystem ${subsys}`);

    // TODO: validate subsystem
    const subsysExports = await import(`./${subsys}.js`);
    process.loadSubsystem(subsys, subsysExports.default);
}

const NTDLL_EXPORTS = {
    [NTDLL.SubsystemLoaded]: SubsystemLoaded
};

export default NTDLL_EXPORTS;