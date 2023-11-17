import { SM_CXFRAME, SM_CXMINIMIZED, SM_CXSCREEN, SM_CXSIZE, SM_CYFRAME, SM_CYSCREEN, SM_CYSIZE } from "../types/user32.types.js";

import { GetW32ProcInfo } from "./shared.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";

// TODO: these should be stored in the shared memory of the process
export function NtIntGetSystemMetrics(peb: PEB, nIndex: number): number {
    const monitor = NtGetPrimaryMonitor();
    switch (nIndex) {
        case SM_CXSCREEN: // SM_CXSCREEN
            return monitor.rcMonitor.right - monitor.rcMonitor.left;
        case SM_CYSCREEN: // SM_CYSCREEN
            return monitor.rcMonitor.bottom - monitor.rcMonitor.top;
        case SM_CXMINIMIZED: // SM_CXMINIMIZED
            return 100; // hardcoded, fix
        case SM_CXMINIMIZED: // SM_CYMINIMIZED
            return 32; // hardcoded, fix
        case SM_CXSIZE:
            return 18; // hardcoded, fix
        case SM_CYSIZE:
            return 18; // hardcoded, fix
        case SM_CXFRAME:
            return 4; // hardcoded, fix
        case SM_CYFRAME:
            return 4; // hardcoded, fix
        default:
            console.warn(`NtIntGetSystemMetrics: unknown index ${nIndex}`);
            return 0;
    }

    return 0;
}
