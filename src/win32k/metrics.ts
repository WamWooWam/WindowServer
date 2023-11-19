import { SM_CXFRAME, SM_CXMINIMIZED, SM_CXSCREEN, SM_CXSIZE, SM_CYFRAME, SM_CYSCREEN, SM_CYSIZE, SPI } from "../types/user32.types.js";

import { GetW32ProcInfo } from "./shared.js";
import { NtGetPrimaryMonitor } from "./monitor.js";
import { ObGetObject } from "../objects.js";
import { PEB } from "../types/types.js";
import { WND } from "./wnd.js";

// TODO: these should be stored in the shared memory of the process
export function NtIntGetSystemMetrics(nIndex: number): number {
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