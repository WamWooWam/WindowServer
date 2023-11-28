import { MONITOR, NtGetPrimaryMonitor, NtRegisterMonitorHook } from "./monitor.js";
import { SM, SPI } from "../../types/user32.types.js";

import { PEB } from "../../types/types.js";
import { SUBSYS_USER32 } from "../../types/subsystems.js";

export function NtInitSysMetrics(peb: PEB) {
    const monitor = NtGetPrimaryMonitor();

    const memory = peb.lpSubsystems.get(SUBSYS_USER32).lpSharedMemory;
    const view = new Int32Array(memory);

    // TODO: there are many more metrics to set here
    view[SM.CXSCREEN] = monitor.rcMonitor.right;
    view[SM.CYSCREEN] = monitor.rcMonitor.bottom;
    view[SM.CXMINIMIZED] = 100;
    view[SM.CYMINIMIZED] = 32;
    view[SM.CXSIZE] = 18;
    view[SM.CYSIZE] = 18;
    view[SM.CXFRAME] = 4;
    view[SM.CYFRAME] = 4;
    view[SM.CXMINTRACK] = 112;
    view[SM.CYMINTRACK] = 27;
    view[SM.CXMAXTRACK] = monitor.rcMonitor.right + 12;
    view[SM.CYMAXTRACK] = monitor.rcMonitor.bottom + 12;
    view[SM.CXBORDER] = 1;
    view[SM.CYBORDER] = 1;
    view[SM.CYCAPTION] = 18;
    view[SM.CXDLGFRAME] = 3;
    view[SM.CYDLGFRAME] = 3;

    const hook = (monitor: MONITOR) => {
        view[SM.CXSCREEN] = monitor.rcMonitor.right;
        view[SM.CYSCREEN] = monitor.rcMonitor.bottom;
        view[SM.CXMAXTRACK] = monitor.rcMonitor.right + 12;
        view[SM.CYMAXTRACK] = monitor.rcMonitor.bottom + 12;
    };

    NtRegisterMonitorHook(hook);
}

// TODO: these should be stored in the shared memory of the process
export function NtIntGetSystemMetrics(peb: PEB, nIndex: number): number {
    if (nIndex < 0 || nIndex >= SM.CMETRICS) {
        console.warn(`NtIntGetSystemMetrics: unknown nIndex ${nIndex}`);
        return 0;
    }

    const memory = peb.lpSubsystems.get(SUBSYS_USER32).lpSharedMemory;
    const view = new Int32Array(memory);

    return view[nIndex];
}

export function NtUserSystemParametersInfo(nParam: SPI, obj: any): boolean {
    switch (nParam) {
        case SPI.GETNONCLIENTMETRICS:
            Object.assign(obj, {
                lfCaptionFont: {
                    lfHeight: 11,
                    lfWidth: 0,
                    lfEscapement: 0,
                    lfOrientation: 0,
                    lfWeight: 700,
                    lfItalic: 0,
                    lfUnderline: 0,
                    lfStrikeOut: 0,
                    lfCharSet: 1,
                    lfOutPrecision: 3,
                    lfClipPrecision: 2,
                    lfQuality: 1,
                    lfPitchAndFamily: 34,
                    lfFaceName: "Pixelated MS Sans Serif"
                },
                lfSmCaptionFont: {
                    lfHeight: 11,
                    lfWidth: 0,
                    lfEscapement: 0,
                    lfOrientation: 0,
                    lfWeight: 400,
                    lfItalic: 0,
                    lfUnderline: 0,
                    lfStrikeOut: 0,
                    lfCharSet: 1,
                    lfOutPrecision: 3,
                    lfClipPrecision: 2,
                    lfQuality: 1,
                    lfPitchAndFamily: 34,
                    lfFaceName: "MS Shell Dlg 2"
                },
            });
            return true;
        default:
            console.warn(`NtUserSystemParametersInfo: unknown nParam ${nParam}`);
            return false;
    }
}