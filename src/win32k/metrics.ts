import { SM, SPI } from "../types/user32.types.js";

import { NtGetPrimaryMonitor } from "./monitor.js";

// TODO: these should be stored in the shared memory of the process
export function NtIntGetSystemMetrics(nIndex: number): number {
    const monitor = NtGetPrimaryMonitor();
    switch (nIndex) {
        case SM.CXSCREEN: // SM.CXSCREEN
            return monitor.rcMonitor.right - monitor.rcMonitor.left;
        case SM.CYSCREEN: // SM.CYSCREEN
            return monitor.rcMonitor.bottom - monitor.rcMonitor.top;
        case SM.CXMINIMIZED: // SM.CXMINIMIZED
            return 100; // hardcoded, fix
        case SM.CXMINIMIZED: // SM.CYMINIMIZED
            return 32; // hardcoded, fix
        case SM.CXSIZE:
            return 18; // hardcoded, fix
        case SM.CYSIZE:
            return 18; // hardcoded, fix
        case SM.CXFRAME:
            return 4; // hardcoded, fix
        case SM.CYFRAME:
            return 4; // hardcoded, fix
        case SM.CXMINTRACK:
            return 112; // hardcoded, fix
        case SM.CYMINTRACK:
            return 27; // hardcoded, fix
        case SM.CXMAXTRACK:
            return (monitor.rcMonitor.right - monitor.rcMonitor.left) + 12; // hardcoded, fix
        case SM.CYMAXTRACK:
            return (monitor.rcMonitor.bottom - monitor.rcMonitor.top) + 12; // hardcoded, fix
        case SM.CXBORDER:
            return 1; // hardcoded, fix
        case SM.CYBORDER:
            return 1; // hardcoded, fix
        case SM.CYCAPTION:
            return 18; // hardcoded, fix
            case SM.CXDLGFRAME:
            return 3; // hardcoded, fix
        case SM.CYDLGFRAME:
        return 3; // hardcoded, fix

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